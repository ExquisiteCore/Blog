

export const HomeSection = () => {
  let delay = 0;
  // 每次调用，增加延时
  const getDelay = () => (delay += 200);
  return (
    <div className="flex min-h-full  max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
      <p
        className="animate-fade-up text-2xl tracking-widest animate-ease-in-out md:text-5xl"
        style={{
          animationDelay: `${getDelay()}ms`,
        }}
      >
        你好，我是
      </p>
    </div>
  );
};
