import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const generateWaveformData = (length) => {
  return Array.from({ length }, () => ({
    speaker1: Math.random() * 0.5 + 0.5,
    speaker2: Math.random() * 0.5 + 0.5
  }));
};

const SpeakerDiarizationUI = () => {
  const waveformData = generateWaveformData(100);

  const transcriptData = [
    { time: "00:00", speaker: "Spk_1", text: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum" },
    { time: "00:10", speaker: "Spk_2", text: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum" },
    { time: "00:20", speaker: "Spk_1", text: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum" },
    { time: "00:30", speaker: "Spk_2", text: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum" },
  ];

  return (
    <div className="w-full mx-auto p-4 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Speaker Diarization</h2>
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={waveformData}>
            <XAxis dataKey="name" hide />
            <YAxis hide domain={[0, 1]} />
            <Line type="monotone" dataKey="speaker1" stroke="#4CAF50" dot={false} />
            <Line type="monotone" dataKey="speaker2" stroke="#2196F3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-end mb-2">
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span>Speaker 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span>Speaker 2</span>
        </div>
      </div>
      <div className="space-y-2">
        {transcriptData.map((item, index) => (
          <div key={index} className="flex">
            <span className="w-16 flex-shrink-0">{item.time}</span>
            <span className="w-16 flex-shrink-0">{item.speaker}</span>
            <span className="flex-grow">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeakerDiarizationUI;


// gpt-4o

// import React from 'react';
// import { Line } from 'react-chartjs-2';
// import styled from 'styled-components';

// const Container = styled.div`
//   border: 1px solid #e0e0e0;
//   padding: 20px;
//   border-radius: 8px;
//   font-family: Arial, sans-serif;
// `;

// const Header = styled.h3`
//   margin: 0 0 20px 0;
//   font-size: 1.2em;
// `;

// const Subtitle = styled.p`
//   font-weight: bold;
//   margin: 10px 0;
// `;

// const data = {
//   labels: ['00.00', '00.10', '00.20', '00.30'],
//   datasets: [
//     {
//       label: 'Speaker 1',
//       data: [12, 19, 3, 5],
//       borderColor: '#4caf50',
//       backgroundColor: 'rgba(76, 175, 80, 0.2)',
//       fill: true,
//     },
//     {
//       label: 'Speaker 2',
//       data: [2, 3, 20, 15],
//       borderColor: '#3f51b5',
//       backgroundColor: 'rgba(63, 81, 181, 0.2)',
//       fill: true,
//     },
//   ],
// };

// const options = {
//   scales: {
//     x: {
//       beginAtZero: true,
//     },
//     y: {
//       beginAtZero: true,
//     },
//   },
//   plugins: {
//     legend: {
//       display: true,
//       position: 'top',
//     },
//   },
// };

// const SpeakerDiarization = () => {
//   return (
//     <Container>
//       <Header>Speaker Diarization</Header>
//       <Line data={data} options={options} />
//       <Subtitle>00.00 - Spk_1 “ Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ”</Subtitle>
//       <Subtitle>00.10 - Spk_2 “ Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ”</Subtitle>
//       <Subtitle>00.20 - Spk_1 “ Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ”</Subtitle>
//       <Subtitle>00.30 - Spk_2 “ Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ”</Subtitle>
//     </Container>
//   );
// };

// export default SpeakerDiarization;


// gemini


// import React from 'react';
// import './SpeakerDiarization.css';

// function SpeakerDiarization() {
//   const speakerData = [
//     {
//       speaker: 'Spk_1',
//       text: 'Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum',
//       color: 'green'
//     },
//     {
//       speaker: 'Spk_2',
//       text: 'Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum',
//       color: 'blue'
//     },
//     // ... more speakers
//   ];

//   return (
//     <div className="speaker-diarization">
//       <div className="title">Speaker Diarization</div>
//       <div className="legend">
//         <div className="legend-item">
//           <div className="legend-color" style={{ backgroundColor: 'green' }}></div>
//           <span>Speaker 1</span>
//         </div>
//         <div className="legend-item">
//           <div className="legend-color" style={{ backgroundColor: 'blue' }}></div>
//           <span>Speaker 2</span>
//         </div>
//       </div>
//       <div className="waveform">
//         {/* ... waveform component */}
//       </div>
//       <div className="timeline">
//         {speakerData.map((speaker, index) => (
//           <div key={index} className="timeline-item" style={{ color: speaker.color }}>
//             <span className="speaker">{speaker.speaker}</span>
//             <span className="text">{speaker.text}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default SpeakerDiarization;
