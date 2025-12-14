import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingWidgetProps {
  isLoading: boolean;
}

const LoadingWidget = ({ isLoading }: LoadingWidgetProps) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    "Identifying product...",
    "Scanning retailers...",
    "Analyzing specs...",
    "Comparing prices..."
  ];

  useEffect(() => {
    if (!isLoading) {
      setCompletedSteps([]);
      return;
    }

    // Animate steps checking off one by one
    const interval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev.length < steps.length) {
          return [...prev, prev.length];
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Loading initial findings...
          </h2>
          <p className="text-gray-600 text-sm">
            because the Millennium Falcon takes off now.
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 transition-all duration-300 ${
                completedSteps.includes(index) ? "opacity-100" : "opacity-50"
              }`}
            >
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  completedSteps.includes(index)
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {completedSteps.includes(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  completedSteps.includes(index)
                    ? "text-gray-900"
                    : "text-gray-600"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-400 to-teal-600 h-full transition-all duration-300"
            style={{
              width: `${(completedSteps.length / steps.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingWidget;
