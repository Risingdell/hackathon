// frontend/src/App.jsx
import { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [nlQuery, setNlQuery] = useState("");
  const [result, setResult] = useState(null);



  const handleSubmit = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/sql/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nl_query: nlQuery }) // only pass nl_query
    });

    const data = await response.json();
    setResult(data.data); // PostgreSQL results returned from backend
  } catch (err) {
    console.error(err);
    setResult([{ error: err.message }]);
  }
};

  // const handleSubmit = async () => {
  //   try {
  //     const response = await axios.post("http://localhost:5000/api/sql/query", {
  //       nl_query: nlQuery,
  //       sql_query: "SELECT * FROM customers;" // hardcoded for now
  //     });

  //     setResult(response.data.data);
  //   } catch (err) {
  //     console.error(err);
  //     setResult([{ error: err.message }]);
  //   }
  // };



  return (
    <>
    <div className="parent-1" style={{ padding: "2rem" }}>
      <h2 className="head">NL-to-SQL Demo</h2>

      <input className="input"
        type="text"
        value={nlQuery}
        onChange={(e) => setNlQuery(e.target.value)}
        placeholder="Type natural language query"
        style={{ width: "300px", marginRight: "1rem" }}
      />
      <button onClick={handleSubmit}>Submit</button>

    </div>
    <div>
      <h5>Result:</h5>
            <pre>{result && JSON.stringify(result, null, 2)}</pre>


    </div>
    </>

  );
}

export default App;
