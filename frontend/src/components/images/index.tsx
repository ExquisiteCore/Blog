'use client'
import { useEffect, useState } from 'react';

export function Images() {
  const [imageList, setImageList] = useState<string[]>([]);

  useEffect(() => {
    // 从public/images目录获取图片
    const images = [
      '/images/ht.png',
      '/images/kq.png',
      '/images/kq2.png',
      '/images/lh.png',
      '/images/sh.png',
      '/images/xg.png',
      '/images/ying.png',
    ];
    setImageList(images);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen -z-10 bg-[#363636] overflow-hidden before:content-[''] before:block before:absolute before:inset-0 before:bg-black/20 before:transition-all before:duration-200 before:ease-in-out">
      <ul>
        {imageList.map((image, index) => (
          <li
            key={index}
            className={`absolute inset-0 w-full h-full bg-no-repeat bg-center bg-cover opacity-0 animate-[imageAnimation_30s_linear_infinite] backface-hidden preserve-3d ${index === 1 ? 'animation-delay-6s' : ''} ${index === 2 ? 'animation-delay-12s' : ''} ${index === 3 ? 'animation-delay-18s' : ''} ${index === 4 ? 'animation-delay-24s' : ''} ${index === 5 ? 'animation-delay-30s' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          ></li>
        ))}
      </ul>

      {/* 添加全局样式 */}
      <style jsx global>{`
        @keyframes imageAnimation {
          0% {
            opacity: 0;
            animation-timing-function: ease-in;
          }

          2% {
            opacity: 1;
          }

          8% {
            opacity: 1;
            transform: scale(1.05);
            animation-timing-function: ease-out;
          }

          17% {
            opacity: 1;
            transform: scale(1.1);
          }

          25% {
            opacity: 0;
            transform: scale(1.1);
          }

          100% {
            opacity: 0;
          }
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }

        .animation-delay-6s {
          animation-delay: 6s;
        }

        .animation-delay-12s {
          animation-delay: 12s;
        }

        .animation-delay-18s {
          animation-delay: 18s;
        }

        .animation-delay-24s {
          animation-delay: 24s;
        }

        .animation-delay-30s {
          animation-delay: 30s;
        }
      `}</style>
    </div>
  );
}