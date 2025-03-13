'use client';
import React from 'react';
import { TypeAnimation } from 'react-type-animation';


export function Brand() {
  return (
    <div className="flex justify-center items-center flex-col relative w-full h-screen min-h-40 text-foreground">
      <div className="flex justify-center items-center flex-col fixed -z-10 top-60">
        {/* 标题 */}
        <p className="font-['Fredericka_the_Great',Mulish,-apple-system,'PingFang_SC','Microsoft_YaHei',sans-serif] text-[4.5em] leading-normal animate-titleScale text-white shadow-title">
          ExquisiteCore
        </p>
        {/* 打字机 */}
        <div className="bg-white/50 p-2 rounded-lg">
          <div className="tracking-wider bg-gradient-to-r from-[#f79533] via-[#ef4e7b] to-[#6fba82] bg-clip-text text-transparent font-bold text-2xl sm:text-base md:text-2xl">
            <TypeAnimation
              sequence={[
                'C语言应属于文学，而C++应属于艺术。',
                3000,
                '',
                100,
                '生活明朗，万物可爱，人间值得。',
                3000,
                '',
                100,
              ]}
              wrapper="span"
              cursor={true}
              repeat={Infinity}
              style={{ display: 'inline-block' }}
            />
          </div>
        </div>
      </div>

      {/* 添加全局样式 */}
      <style jsx global>{`
        @keyframes titleScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .animate-titleScale {
          animation: titleScale 1s;
        }
        
        .shadow-title {
          text-shadow: 0 1px 0 hsl(174, 5%, 80%), 0 2px 0 hsl(174, 5%, 75%),
          0 3px 0 hsl(174, 5%, 70%), 0 4px 0 hsl(174, 5%, 66%),
          0 5px 0 hsl(174, 5%, 64%), 0 6px 0 hsl(174, 5%, 62%),
          0 7px 0 hsl(174, 5%, 61%), 0 8px 0 hsl(174, 5%, 60%),
          0 0 5px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.2),
          0 3px 5px rgba(0, 0, 0, 0.2), 0 5px 10px rgba(0, 0, 0, 0.2),
          0 10px 10px rgba(0, 0, 0, 0.2), 0 20px 20px rgba(0, 0, 0, 0.3);
        }
        
        @media (max-width: 500px) {
          .font-\[\'Fredericka_the_Great\'\,Mulish\,-apple-system\,\'PingFang_SC\'\,\'Microsoft_YaHei\'\,sans-serif\] {
            font-size: 3em;
          }
        }
        
        @media (max-width: 767px) {
          .flex.justify-center.items-center.flex-col.relative.w-full.h-screen.min-h-40.text-foreground {
            padding: 3rem 0.5rem 0;
          }
        }
      `}</style>
    </div>
  );
}