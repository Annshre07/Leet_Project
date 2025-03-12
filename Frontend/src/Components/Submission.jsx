import React from "react";
function Submission({setMessage}) {
  const handleClick = () => {
    setMessage("You are in a Submission Ann!!");

  };

  return (
    <div>
      <button
      onClick={handleClick}
      style={{
        padding: "10px",
        fontSize: "16px",
        border: "none", 
        background: "transparent", 
        cursor: "pointer" 
      }}
    >
      Submission
    </button>
  
    </div>
    
    
  );
}

export default Submission;
