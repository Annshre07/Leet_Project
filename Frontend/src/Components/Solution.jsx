import React from "react";
function Solution({setMessage}) {
  const handleClick = () => {
    setMessage("You are in a Solution!!");
    console.log("Solution button clicked!");
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
      Solution
    </button>
  
    </div>
    
    
  );
}

export default Solution;
