import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Mock Speechly hooks for demonstration
// In your actual application, replace this with:
// import { useSpeechContext } from '@speechly/react-client';

const useSpeechContext = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState({ text: '' });
  const [segment, setSegment] = useState(null);
  let recognition = null;

  if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
  }

  const startListening = () => {
    if (!recognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }
    setListening(true);
    setTranscript({ text: '' });

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setSegment({
          words: finalTranscript.split(' ').map(word => ({ value: word })),
          isFinal: true,
        });
      }

      const interimTranscript = event.results[event.results.length - 1][0].transcript;
      setTranscript({ text: interimTranscript });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setListening(false);
  };

  return { listening, transcript, segment, startListening, stopListening };
};


function VoiceRecorder() {
  const { listening, transcript, segment, startListening, stopListening } = useSpeechContext();
  const [isProcessing, setIsProcessing] = useState(false);

  // Send data to a webhook when a final speech segment is received
  useEffect(() => {
    if (segment && segment.isFinal) {
      const commandText = segment.words.map(w => w.value).join(' ');

      if (commandText.trim().length > 0) {
        console.log('Final transcript:', commandText);
        setIsProcessing(true);

        // Send the data to your n8n webhook
        axios.post('https://afnankaazi.app.n8n.cloud/webhook-test/0129007d-4cb4-470f-b7b3-6e61958df8e6', {
            transcript: commandText,
            timestamp: new Date().toISOString()
          })
          .then(response => {
            console.log('Webhook sent successfully:', response.data);
          })
          .catch(error => {
            console.error('Error sending webhook:', error);
          })
          .finally(() => {
            setIsProcessing(false);
          });
      }
    }
  }, [segment]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Voice Recorder for Webhook</h1>
        <p style={{ fontSize: '1.2rem', color: '#888' }}>
          {listening ? 'Listening...' : 'Click the button and start speaking'}
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          onClick={listening ? stopListening : startListening}
          disabled={isProcessing}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            cursor: 'pointer',
            backgroundColor: listening ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          {listening ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '1rem', minHeight: '100px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Live Transcript:</h2>
        <p style={{ fontSize: '1.1rem' }}>{transcript.text}</p>
      </div>
       {isProcessing && <p style={{ textAlign: 'center', marginTop: '1rem' }}>Processing and sending to webhook...</p>}
    </div>
  );
}

// In your main App.js or index.js, you would wrap this component with the SpeechProvider
// import { SpeechProvider } from '@speechly/react-client';

// function App() {
//   return (
//     <SpeechProvider appId="your-speechly-app-id">
//       <VoiceRecorder />
//     </SpeechProvider>
//   );
// }

export default VoiceRecorder;