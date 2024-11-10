const WaveLoadingAnimation = () => (
  <div className="flex items-center justify-center space-x-1 h-full">
    {[...Array(6)].map((_, index) => (
      <div
        key={index}
        className="w-2 bg-purple-500 rounded-full animate-wave"
        style={{
          height: `${40 + Math.random() * 60}%`,
          animationDelay: `${index * 0.1}s`,
        }}
      ></div>
    ))}
  </div>
);

export default WaveLoadingAnimation;


{/* <div className="w-full h-full inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div> */}