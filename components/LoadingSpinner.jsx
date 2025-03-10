const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center">
            {/* Spinning icon */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
            {/* Loading text */}
            <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
