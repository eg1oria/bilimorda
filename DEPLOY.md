# Bilimorda: production deployment

Production рассчитан на один Ubuntu/Debian VPS:

- nginx и Certbot установлены на хосте;
- frontend и backend запускаются через Docker Compose;
- nginx принимает `80/443` и проксирует только в Next.js на `127.0.0.1:3000`;
- NestJS доступен только во внутренней Docker-сети;
- SQLite хранится в именованном Docker-томе;
- проверенные backup-файлы сохраняются в `/var/backups/bilimorda`.

Команды ниже предполагают, что репозиторий расположен в `/opt/bilimorda`.
Никогда не запускайте `docker compose down -v`: флаг `-v` удалит production-базу.

## 1. DNS и firewall

До получения сертификата создайте DNS-записи:

- `A` для `bilimorda.ink` на IPv4 сервера;
- `A` для `www.bilimorda.ink` на тот же IPv4;
- `AAAA` добавляйте только при реально настроенном IPv6.

Откройте только SSH, HTTP и HTTPS. Для UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Docker публикует frontend только на `127.0.0.1:3000`, поэтому порт приложения
не доступен снаружи.

## 2. Пакеты сервера

Установите Git, nginx, Certbot, OpenSSL и Docker Engine с Compose plugin.
Актуальная установка Docker должна выполняться из
[официального apt-репозитория Docker](https://docs.docker.com/engine/install/ubuntu/).

Для Ubuntu:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo docker version
sudo docker compose version
```

Для Debian используйте
[официальную Debian-инструкцию Docker](https://docs.docker.com/engine/install/debian/)
при создании apt-репозитория; остальные шаги не меняются.

## 3. Код, каталоги и секреты

```bash
sudo install -d -m 0755 /opt/bilimorda
sudo chown "$USER":"$USER" /opt/bilimorda
git clone https://github.com/eg1oria/bilimorda.git /opt/bilimorda
cd /opt/bilimorda

sudo install -d -m 0755 /var/www/certbot
sudo install -d -m 0700 /var/backups/bilimorda

cp .env.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 32
```

Запишите две разные полученные строки в `.env`:

```dotenv
SITE_URL=https://bilimorda.ink
ADMIN_API_KEY=<первая строка>
ADMIN_ROUTE_TOKEN=<вторая строка>
BACKUP_DIR=/var/backups/bilimorda
BACKUP_RETENTION_DAYS=30
```

Файл `.env` нельзя коммитить, копировать в тикеты или отправлять в сообщения.
Админка будет доступна по адресу
`https://bilimorda.ink/manage/<ADMIN_ROUTE_TOKEN>`.

Проверьте итоговую конфигурацию и соберите все образы:

```bash
cd /opt/bilimorda
sudo docker compose --profile maintenance config --quiet
sudo docker compose --profile maintenance build --pull
sudo docker compose up -d
sudo docker compose ps
curl --fail --silent --show-error http://127.0.0.1:3000/api/health
```

При первом запуске backend применит миграции, добавит 72 вопроса и опубликует
версию теста №1. При последующих запусках существующая БД не перезаписывается.

## 4. Первый сертификат и nginx

Сначала включите временный HTTP-конфиг для ACME challenge:

```bash
sudo install -m 0644 \
  /opt/bilimorda/deploy/nginx/server-names-hash.conf \
  /etc/nginx/conf.d/bilimorda-server-names-hash.conf
sudo install -m 0644 \
  /opt/bilimorda/deploy/nginx/bilimorda.bootstrap.conf \
  /etc/nginx/sites-available/bilimorda.conf
sudo ln -s /etc/nginx/sites-available/bilimorda.conf \
  /etc/nginx/sites-enabled/bilimorda.conf
if [ -L /etc/nginx/sites-enabled/default ]; then
  sudo unlink /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl reload nginx
```

Убедитесь, что обе DNS-записи уже указывают на сервер, затем получите один
сертификат с обоими именами. Certbot интерактивно запросит email и согласие с
условиями:

```bash
sudo certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d bilimorda.ink \
  -d www.bilimorda.ink
```

После успешного выпуска включите финальный HTTPS-конфиг:

```bash
sudo install -m 0644 \
  /opt/bilimorda/deploy/nginx/bilimorda.conf \
  /etc/nginx/sites-available/bilimorda.conf
sudo nginx -t
sudo systemctl reload nginx
sudo install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
sudo install -m 0755 \
  /opt/bilimorda/deploy/certbot/reload-nginx.sh \
  /etc/letsencrypt/renewal-hooks/deploy/bilimorda-reload-nginx
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
```

Проверьте внешний контур:

```bash
curl --fail --silent --show-error https://bilimorda.ink/api/health
curl --head https://www.bilimorda.ink/
curl --head http://bilimorda.ink/
```

Оба последних запроса должны перенаправлять на `https://bilimorda.ink/`.

## 5. Ежедневные backup-копии

Сначала вручную создайте и проверьте одну копию:

```bash
cd /opt/bilimorda
sudo docker compose --profile maintenance run --rm --no-deps backup
sudo ls -lah /var/backups/bilimorda
```

Backup выполняется онлайн через SQLite `.backup`, затем запускает
`PRAGMA quick_check`. Копии старше 30 дней удаляются только после успешного
создания и проверки новой.

Установите systemd timer:

```bash
sudo install -m 0644 deploy/systemd/bilimorda-backup.service \
  /etc/systemd/system/bilimorda-backup.service
sudo install -m 0644 deploy/systemd/bilimorda-backup.timer \
  /etc/systemd/system/bilimorda-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now bilimorda-backup.timer
sudo systemctl start bilimorda-backup.service
sudo systemctl status bilimorda-backup.timer
sudo journalctl -u bilimorda-backup.service -n 50 --no-pager
```

Timer запускается ежедневно в `02:30 UTC` с задержкой до десяти минут.
Локальная копия не защищает от полной потери VPS; каталог
`/var/backups/bilimorda` нужно дополнительно реплицировать во внешнее
хранилище, когда оно будет выбрано.

## 6. Ручное обновление

Перед каждым обновлением создавайте отдельную backup-копию:

```bash
cd /opt/bilimorda
sudo docker compose --profile maintenance run --rm --no-deps backup
git status --short
git pull --ff-only
sudo docker compose --profile maintenance config --quiet
sudo docker compose --profile maintenance build --pull
sudo docker compose up -d --remove-orphans
sudo docker compose ps
curl --fail --silent --show-error http://127.0.0.1:3000/api/health
curl --fail --silent --show-error https://bilimorda.ink/api/health
sudo docker compose logs --tail=100 backend frontend
```

`git status --short` должен быть пустым перед `git pull`. Миграции применяются
автоматически до запуска новой версии backend.

## 7. Восстановление SQLite

Выполняйте восстановление только из копии, которая успешно прошла
`quick_check`. Сначала выберите точное имя:

```bash
sudo ls -1 /var/backups/bilimorda/bilimorda-*.db
```

Проверьте выбранный файл внутри backup-образа:

```bash
cd /opt/bilimorda
sudo docker compose --profile maintenance run --rm --no-deps \
  --entrypoint sqlite3 backup \
  /backups/bilimorda-YYYYMMDDTHHMMSSZ.db "PRAGMA quick_check;"
```

Остановите backend и замените только файл базы. В команде ниже дважды укажите
фактическое имя backup:

```bash
sudo docker compose stop backend
sudo docker run --rm \
  --user 0:0 \
  --cap-add CHOWN \
  -v bilimorda_backend_data:/data \
  -v /var/backups/bilimorda:/restore:ro \
  alpine:3.22 sh -eu -c '
    cp /data/bilimorda.db /data/bilimorda.pre-restore.db
    cp /restore/bilimorda-YYYYMMDDTHHMMSSZ.db /data/bilimorda.db
    chown 1000:1000 /data/bilimorda.db
    chmod 0600 /data/bilimorda.db
  '
sudo docker compose up -d
sudo docker compose ps
curl --fail --silent --show-error http://127.0.0.1:3000/api/health
```

После подтверждения корректной работы перенесите
`bilimorda.pre-restore.db` в защищённый архив или удалите вручную.

## Диагностика

```bash
cd /opt/bilimorda
sudo docker compose ps
sudo docker compose logs --tail=200 backend frontend
sudo nginx -t
sudo journalctl -u nginx -n 100 --no-pager
sudo journalctl -u bilimorda-backup.service -n 100 --no-pager
sudo systemctl list-timers certbot.timer bilimorda-backup.timer
```

Backend не публикует порт на хост. Проверять его отдельно нужно через
`docker compose exec backend`, а внешние `/api/*` всегда должны проходить через
Next.js.
