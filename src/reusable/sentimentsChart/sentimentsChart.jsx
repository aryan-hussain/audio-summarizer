import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: 0, sentiment: 0.5 },
  { time: 50, sentiment: 0.4 },
  { time: 100, sentiment: 0.2 },
  { time: 150, sentiment: 0.4 },
  { time: 200, sentiment: 0.1 },
  { time: 250, sentiment: 0.3 },
];

const SentimentsChart = ({ title, overallScore, data, areaColor }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-solid border-slate">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary">
            {title} Sentiment
          </h2>
          <p className="text-lg mb-4 text-primary">
            Overall Score: {overallScore}{" "}
            {overallScore < 0 ? (
              <span className="text-rose-600">(Negative)</span>
            ) : overallScore >= 0 && overallScore <= 2 ? (
              <span className="text-[#345eff]">(Neutral)</span>
            ) : overallScore > 2 ? (
              <span className="text-green-500">(Positive)</span>
            ) : (
              ""
            )}
          </p>
        </div>
        <div>
          <span className="text-primary">(Y Axis - Sentiment Score)</span>{" "}
          <br />
          <span className="text-primary">(X Axis - Seconds)</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              label={{
                value: "",
                position: "insideBottomRight",
                offset: -10,
              }}
            />
            <YAxis
              domain={[-1, 1]}
              label={{
                value: "",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="y"
              stroke={areaColor}
              fill={areaColor}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentsChart;
