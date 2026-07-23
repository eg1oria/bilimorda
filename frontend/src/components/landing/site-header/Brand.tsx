import { getImageProps } from "next/image";

export default function Brand({ homeLabel, href = '#top' }: { homeLabel: string; href?: string }) {
  const common = {
    alt: "",
  };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: "/logo.webp",
    width: 778,
    height: 321,
    sizes: "160px",
  });
  const {
    props: { srcSet: mobileSrcSet, ...mobileImageProps },
  } = getImageProps({
    ...common,
    src: "/logo-small.webp",
    width: 5693,
    height: 7255,
    sizes: "43px",
  });

  return (
    <a href={href} aria-label={homeLabel}>
      <picture>
        <source media="(min-width: 521px)" srcSet={desktopSrcSet} />
        <source media="(max-width: 520px)" srcSet={mobileSrcSet} />
        <img
          {...mobileImageProps}
          alt=""
          className="block h-[66px] w-[160px] object-contain max-[520px]:h-[55px] max-[520px]:w-[43px]"
        />
      </picture>
    </a>
  );
}
