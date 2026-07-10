const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center">
            {/* Spinning icon */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-100 border-t-teal-600 mb-4"></div>
            {/* Loading text */}
            <p className="text-slate-500 text-lg font-medium">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
