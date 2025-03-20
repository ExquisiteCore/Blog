import { Images } from "../images";
import { Brand } from "../brand";

export function HomeSection() {
  return (
    <div className="flex min-h-full  max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
      <Images />
      <Brand />
    </div>
  );
};
