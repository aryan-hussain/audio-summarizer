import { convertTalkTimeToPercentage } from "@/lib/helper";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const ConversationCharacteristics = ({
  language,
  totalTalkTime,
  agentTime,
  customerTime,
  agentTalkSpeed,
  customerTalkSpeed,
  talkTime,
}) => {
  const talkTimeData = convertTalkTimeToPercentage(talkTime);

  // Data for the talk speed bar chart
  const talkSpeedData = [
    { name: "Agent", speed: agentTalkSpeed },
    { name: "Customer", speed: customerTalkSpeed },
  ];
  
  const nonTalkTimeData = [
    { name: "Agent", value: 95 },
    { name: "Customer", value: 55 },
    { name: "Other", value: 55 }, // Added to make the circle complete
  ];

  const COLORS = ["#134B70", "#508C9B", "#60A5FA", "#10B981"];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto border border-solid border-[#ddd]">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold mb-4 text-primary">
          Conversation Characteristics
        </h2>
        <div className="text-right mb-4 text-primary">Language: {language}</div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="w-1/2 pr-4 my-2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={talkTimeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={false}
              >
                {talkTimeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center font-semibold mb-3 text-primary">Talk Time</div>
          <div className="text-center">
            <div className="flex justify-between w-full">
              <span className="text-primary">Total Talk Time</span>
              <span className="text-primary">{totalTalkTime}</span>
            </div>
          </div>
          <div className="flex flex-col justify-between mt-3">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-agent mr-2 rounded-full"></span>
              <div className="flex justify-between w-full">
                <span className="text-primary">Agent:</span>
                <span className="text-primary">{agentTime}</span>
              </div>
            </div>
            <div className="flex items-center mb-3">
              <span className="inline-block w-3 h-3 bg-customer mr-2 rounded-full"></span>
              <div className="flex justify-between w-full">
                <span className="text-primary">Customer:</span>
                <span className="text-primary">{customerTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="w-1/2 pl-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={nonTalkTimeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={false}
              >
                {nonTalkTimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center font-semibold">Non-Talk Time</div>
          <div className="text-center">Total Talk Time: 4m 11s</div>
          <div className="flex justify-between mt-2">
            <div>
              <span className="inline-block w-3 h-3 bg-blue-400 mr-2"></span>
              Agent: 1m 35s
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
              Customer: 2m 35s
            </div>
          </div>
        </div> */}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-6 text-primary">
          Talk Speed (Avg. Words/Minutes):
        </h3>
        <ResponsiveContainer className="my-6" width="100%" height={230}>
          <BarChart data={talkSpeedData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="speed" fill="#8884d8">
              {talkSpeedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mb-2">
          <span className="text-primary">Agent:</span>
          <span className="font-bold text-primary">{agentTalkSpeed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-primary">Customer:</span>
          <span className="font-bold text-primary">{customerTalkSpeed}</span>
        </div>
      </div>

      {/* <div>
        <h3 className="text-xl font-semibold mb-2">Interruption</h3>
        <div className="flex justify-between">
          <span>Agent:</span>
          <span className="font-bold">12</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-bold">24</span>
        </div>
      </div> */}
    </div>
  );
};

export default ConversationCharacteristics;
