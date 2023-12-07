import './App.css';
import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import Report from './component/Report';

function App() {
  const [file, setFile] = useState(null);
  const [code, setCode] = useState(null);
  const [Statement_Cov, setStatement_Cov] = useState({});
  const [Decision_Cov, setDecision_Cov] = useState({});
  const [Condition_Cov, setCondition_Cov] = useState({});
  const [MCDC_Cov, setMCDC_Cov] = useState({});

  const [msg, setMsg] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleFileSubmit = async (event) => {
    event.preventDefault();

    if (file) {
      setMsg('Uploading file... (This May Take A While)');
      const reader = new FileReader();
      reader.onload = async (e) => {
        const code = e.target.result;
        console.log('Code:', code);
        try {
          const response = await fetch('http://localhost:5000/saveCode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code }),
          });

          if (response.ok) {

            const responseBody = await response.json();
            setCode(code);
            setStatement_Cov(responseBody.Statement_Cov);
            setDecision_Cov(responseBody.Decision_Cov);
            setCondition_Cov(responseBody.Condition_Cov);
            setMCDC_Cov(responseBody.MCDC_Cov);
            setMsg(null);

          } else {
            console.error('Failed to save code:', response.statusText);
          }
        } catch (error) {
          console.error('Error:', error.message);
        }
      };
      reader.readAsText(file);
    }
  }

  return (
    <Container>
      {
        !code &&
        <>
          <h1>React Bootstrap Code Input</h1>
          <Form onSubmit={handleFileSubmit}>
            <Form.Group controlId="fileInput">
              <Form.Label>Select JS File</Form.Label>
              <Form.Control type="file" accept=".js" onChange={handleFileChange} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
          {msg && <p>{msg}</p>}
        </>
      }

      {
        code &&
        <>
          <Report code={code} statement={Statement_Cov} decision={Decision_Cov} condition={Condition_Cov} mcdc={MCDC_Cov} />
        </>
      }

    </Container>
  );
}

export default App;
