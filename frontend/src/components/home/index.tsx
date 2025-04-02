import { Images } from "../images";
import { Brand } from "../brand";
import { FeaturesSection } from "./features-section";

export function HomeSection() {
  return (
    <>
      <div className="relative w-full h-screen">
        <Images />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brand />
        </div>
      </div>
      <div className="w-full -mt-16"> {/* 增加负margin值以完全消除空隙 */}
        <FeaturesSection />
      </div>
    </>
  );
}
