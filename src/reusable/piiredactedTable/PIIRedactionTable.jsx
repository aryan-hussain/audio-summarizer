import { capitalizeFirstLetter } from "@/lib/helper";
import React from "react";

const PIIRedactionTable = ({ piiRedacted }) => {
  
  return (
    <div className="bg-white h-full p-6 rounded-lg shadow-lg max-w-3xl border border-solid border-[#ddd] mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-primary">PII Redaction</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {/* <th className="py-2 px-4 text-left font-semibold">Number</th> */}
            <th className="py-2 px-4 text-left font-semibold ">PII Entity</th>
            <th className="py-2 px-4 text-left font-semibold ">Details</th>
          </tr>
        </thead>
        <tbody>
          {/* {piiRedacted.length > 0 &&
            piiRedacted.map((replacement, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td>
                  <span className="py-2 px-4 text-primary">
                    {capitalizeFirstLetter(replacement[2])}
                  </span>
                </td>
                <td className="py-2 px-4 text-primary">{replacement[0]}</td>
              </tr>
            ))} */}
          {Object.entries(piiRedacted).map(([key, value]) => (
            <tr key={key} className="border-b border-gray-200">
              <td>
                <span className="py-2 px-4 text-primary">{key}</span>
              </td>
              <td className="py-2 px-4 text-primary">{value || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PIIRedactionTable;
