'use client';
import React from 'react';

const HeaderColorOptions = () => {
  const colorSchemes = [
    {
      name: "Current - Teal/Lime",
      header: "bg-teal-700",
      text: "text-lime-100",
      hover: "hover:bg-lime-50 hover:text-teal-700",
      active: "bg-lime-100 text-teal-700",
      description: "Bold and unique, very energetic"
    },
    {
      name: "Vibrant Purple/Pink",
      header: "bg-purple-600",
      text: "text-pink-100",
      hover: "hover:bg-pink-100 hover:text-purple-700",
      active: "bg-pink-100 text-purple-700",
      description: "Modern, youthful, community-focused"
    },
    {
      name: "Energetic Blue/Orange",
      header: "bg-blue-600",
      text: "text-orange-100",
      hover: "hover:bg-orange-100 hover:text-blue-700",
      active: "bg-orange-100 text-blue-700",
      description: "Complementary colors, high energy"
    },
    {
      name: "Warm Orange/Yellow",
      header: "bg-orange-600",
      text: "text-yellow-100",
      hover: "hover:bg-yellow-100 hover:text-orange-700",
      active: "bg-yellow-100 text-orange-700",
      description: "Friendly, warm, inviting"
    },
    {
      name: "Fresh Teal/Cyan",
      header: "bg-teal-600",
      text: "text-cyan-100",
      hover: "hover:bg-cyan-100 hover:text-teal-700",
      active: "bg-cyan-100 text-teal-700",
      description: "Calmer than current, still energetic"
    },
    {
      name: "Bold Indigo/Amber",
      header: "bg-indigo-600",
      text: "text-amber-100",
      hover: "hover:bg-amber-100 hover:text-indigo-700",
      active: "bg-amber-100 text-indigo-700",
      description: "Professional yet energetic"
    }
  ];

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Header Color Options</h1>
      
      <div className="space-y-8">
        {colorSchemes.map((scheme, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className={`${scheme.header} p-4`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${scheme.text}`}>Telugufy</h2>
                <div className="flex gap-4">
                  <button className={`px-4 py-2 rounded ${scheme.text}`}>
                    Normal Link
                  </button>
                  <button className={`px-4 py-2 rounded ${scheme.hover}`}>
                    Hover Link
                  </button>
                  <button className={`px-4 py-2 rounded ${scheme.active}`}>
                    Active Link
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{scheme.name}</h3>
              <p className="text-slate-600">{scheme.description}</p>
              <div className="mt-2 text-sm text-slate-500">
                <code>Header: {scheme.header}</code><br/>
                <code>Text: {scheme.text}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Things to Consider:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Contrast:</strong> All options meet WCAG accessibility standards</li>
          <li><strong>Energy Level:</strong> Brighter colors = more energy, but can be overwhelming if overused</li>
          <li><strong>Brand Identity:</strong> Pick colors that match your community's personality</li>
          <li><strong>User Comfort:</strong> Consider that users will see this header on every page</li>
        </ul>
      </div>
    </div>
  );
};

export default HeaderColorOptions;