import React from "react";
function Editorial({setMessage}) {
  const handleClick = () => {
    setMessage("You are in a Editorial!! ");
    
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
      Editorial
    </button>
    </div>
    
    
  );
}

export default Editorial;
