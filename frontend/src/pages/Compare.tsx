import ComparisonProductCard from "@/components/ComparisonProductCard";

const Compare = () => {
  // Mock comparison data - for comparing specific products
  const comparisonResults = [
    {
      storeName: "Amazon Prime",
      price: "₹10,795",
      rating: 4.5,
      deliveryDate: "12 Jul",
    },
    {
      storeName: "Myntra",
      price: "₹8,995",
      rating: 4.8,
      deliveryDate: "9 Jul",
      isHighlighted: true,
    },
    {
      storeName: "Flipkart",
      price: "₹9,499",
      rating: 4.3,
      deliveryDate: "10 Jul",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Compare Prices</h1>
          <p className="text-slate-400 mt-2">Find the best deal across different stores</p>
        </div>
      </div>

      {/* Product comparison section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Product header */}
        <div className="mb-12">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Nike Air Max 90</h2>
              <p className="text-slate-400">Men's Running Shoes • Size 10</p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-3xl font-bold text-green-400">₹8,995</span>
                <span className="text-sm bg-green-500/20 text-green-300 px-3 py-1 rounded">
                  Best Price
                </span>
              </div>
            </div>
            <div className="aspect-square w-40 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src="https://via.placeholder.com/200"
                alt="Nike Air Max 90"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Comparison cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisonResults.map((result, idx) => (
            <ComparisonProductCard
              key={idx}
              storeName={result.storeName}
              price={result.price}
              rating={result.rating}
              deliveryDate={result.deliveryDate}
              isHighlighted={result.isHighlighted || false}
            />
          ))}
        </div>

        {/* Additional details */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product details */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <h3 className="text-white font-semibold mb-4">Product Details</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex justify-between">
                <span>Brand:</span>
                <span className="font-medium">Nike</span>
              </li>
              <li className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">Running Shoes</span>
              </li>
              <li className="flex justify-between">
                <span>Color:</span>
                <span className="font-medium">Black & Red</span>
              </li>
              <li className="flex justify-between">
                <span>Material:</span>
                <span className="font-medium">Synthetic & Mesh</span>
              </li>
            </ul>
          </div>

          {/* Why compare */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <h3 className="text-white font-semibold mb-4">💡 Why Compare?</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ Save up to 30% on your purchases</li>
              <li>✓ Find the fastest delivery option</li>
              <li>✓ Check seller ratings & reviews</li>
              <li>✓ Compare warranty & return policies</li>
            </ul>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-12">
          <h3 className="text-white font-semibold mb-6">Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-white font-medium">Feature</th>
                  {comparisonResults.map((result, idx) => (
                    <th
                      key={idx}
                      className={`text-left py-3 px-4 font-medium ${
                        result.isHighlighted ? "text-green-400" : "text-white"
                      }`}
                    >
                      {result.storeName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4">Price</td>
                  {comparisonResults.map((result, idx) => (
                    <td
                      key={idx}
                      className={`py-3 px-4 font-semibold ${
                        result.isHighlighted ? "text-green-400" : ""
                      }`}
                    >
                      {result.price}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4">Delivery Time</td>
                  {comparisonResults.map((result, idx) => (
                    <td key={idx} className="py-3 px-4">
                      {result.deliveryDate}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4">Rating</td>
                  {comparisonResults.map((result, idx) => (
                    <td key={idx} className="py-3 px-4">
                      ⭐ {result.rating}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-700/50">
                  <td className="py-3 px-4">Warranty</td>
                  {comparisonResults.map((result, idx) => (
                    <td key={idx} className="py-3 px-4">
                      1 Year
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;