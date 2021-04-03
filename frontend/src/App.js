import React from "react";
import axios from "axios";
import "./App.css";

let api_host = process.env.REACT_APP_API_URL;

let App = () => {
  var [question, setQuestion] = React.useState("");
  var [topics, setTopics] = React.useState([]);
  var [answer, setAnswer] = React.useState("");

  React.useEffect(() => {
    axios.get(`${api_host}/get_topics`).then(({ data: { topics } }) => {
      setTopics(topics);
    });
  }, []);

  React.useEffect(() => {
    axios.post(`${api_host}/submit_question`, { question }).then(({ data }) => {
      if (data) {
        setAnswer(data.answer);
      }
    });
  }, [question]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>List of topics to ask a question on</h1>
        <ul>
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <label>
          Question:
          <input
            type="text"
            value={question}
            onChange={({ target }) => {
              if (target) {
                setQuestion(target.value);
              }
            }}
          />
        </label>
        <h1>Answer: {answer}</h1>
      </header>
    </div>
  );
};

export default App;
