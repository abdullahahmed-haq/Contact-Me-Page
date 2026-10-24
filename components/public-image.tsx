import Image, { type ImageProps } from "next/image";
import { canOptimizeImage } from "@/lib/image-policy";

type Props = Pick<
  ImageProps,
  | "alt"
  | "width"
  | "height"
  | "sizes"
  | "className"
  | "style"
  | "loading"
  | "fetchPriority"
> & { src: string };

export function PublicImage(props: Props) {
  return canOptimizeImage(props.src) ? (
    <Image {...props} quality={80} />
  ) : (
    <img {...props} />
  );
}
