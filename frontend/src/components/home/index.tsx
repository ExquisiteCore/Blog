import { Images } from "../images";

export const HomeSection = () => {

  return (
    <div className="flex min-h-full  max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
      <Images />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Welcome to the <span className="text-blue-500">Home</span> page!
        </h1>
        <p className="text-base leading-7 text-gray-600">
          This is the Home page of the website.
        </p>
      </div>
    </div>
  );
};
