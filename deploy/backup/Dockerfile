FROM alpine:3.22

RUN apk add --no-cache sqlite

COPY backup.sh /usr/local/bin/bilimorda-backup
RUN chmod 0755 /usr/local/bin/bilimorda-backup

ENTRYPOINT ["/usr/local/bin/bilimorda-backup"]
