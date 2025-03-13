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
    <div className="imgs">
      <ul>
        {imageList.map((image, index) => (
          <li
            key={index}
            className="item"
            style={{ backgroundImage: `url(${image})` }}
          ></li>
        ))}
      </ul>

      <style jsx>{`
        .imgs {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: -9;
          background-color: #363636;
          overflow: hidden;
        }

        .imgs::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease-in-out 0s;
        }

        .item {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: no-repeat 50% 50% / cover;
          opacity: 0;
          animation: imageAnimation 30s linear infinite 0s;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .item:nth-child(2) {
          animation-delay: 6s;
        }

        .item:nth-child(3) {
          animation-delay: 12s;
        }

        .item:nth-child(4) {
          animation-delay: 18s;
        }

        .item:nth-child(5) {
          animation-delay: 24s;
        }

        .item:nth-child(6) {
          animation-delay: 30s;
        }

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
      `}</style>
    </div>
  );
}