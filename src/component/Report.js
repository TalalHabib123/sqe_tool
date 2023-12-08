import React, { useState, useRef } from "react";
import { parseScript } from "esprima";
import PieChart from "./PieChart";
//import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Report = ({ code, statement, decision, condition, mcdc }) => {
  const [TotalFunctions, setTotalFunctions] = useState(0);
  const [CoveredFunctions, setCoveredFunctions] = useState(0);
  const [TotalStatement, setTotalStatement] = useState(0);
  const [CoveredStatement, setCoveredStatement] = useState(0);
  const [TotalDecision, setTotalDecision] = useState(0);
  const [CoveredDecision, setCoveredDecision] = useState(0);
  const [TotalCondition, setTotalCondition] = useState(0);
  const [CoveredCondition, setCoveredCondition] = useState(0);

  const pdfRef = useRef();

  const generatePieChartData = (covered, notCovered) => {
    return {
      labels: ["Covered", "Not Covered"],
      datasets: [
        {
          data: [covered, notCovered],
          backgroundColor: ["#3475bf", "#b8433b"],
        },
      ],
    };
  };

  const downloadPDF = () => {
    const input = pdfRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4", true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save("Report.pdf");
    });
  };

  function extractCodeSegments(code) {
    const ast = parseScript(code, { range: true });

    const codeSegments = [];

    function traverse(node) {
      if (
        node.type === "FunctionDeclaration" ||
        node.type === "VariableDeclaration"
      ) {
        codeSegments.push(code.slice(node.range[0], node.range[1]).trim());
      } else if (node.type === "ExpressionStatement") {
        codeSegments.push(code.slice(node.range[0], node.range[1]).trim());
      }

      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(traverse);
      }
    }

    traverse(ast);

    return codeSegments;
  }
  function RenderCode() {
    const Functions = [];
    const CoveredFunctions = [];
    let totalStatement = 0;
    let coveredSatatement = 0;
    let totalDecision = 0;
    let coveredDecision = 0;
    let conditons = 0;
    let coveredConditions = 0;
    condition.Condition_Coverage.forEach((element, index) => {
      for (const key in element.Actual_Coverage) {
        element.Actual_Coverage[key].forEach((element2, index2) => {
          conditons++;
          if (element2 >= 1) {
            coveredConditions++;
          }
        });
      }
    });
    setTotalCondition(conditons);
    setCoveredCondition(coveredConditions);
    statement.Coverages.forEach((element, index) => {
      Functions.push({
        name: element.name,
        s: element.Actual_Coverage,
        d: decision.Decision_Coverage[index].Actual_Coverage,
      });
      let flag = false;
      for (const key in element.Actual_Coverage) {
        totalStatement++;
        if (element.Actual_Coverage[key] >= 1) {
          flag = true;
          coveredSatatement++;
        }
      }
      for (const key in decision.Decision_Coverage[index].Actual_Coverage) {
        totalDecision = totalDecision + 2;
        if (decision.Decision_Coverage[index].Actual_Coverage[key][0] >= 1) {
          //flag = true;
          coveredDecision++;
        }
        if (decision.Decision_Coverage[index].Actual_Coverage[key][1] >= 1) {
          //flag = true;
          coveredDecision++;
        }
      }
      if (flag === true) {
        CoveredFunctions.push(element.name);
      }
    });
    setTotalFunctions(Functions.length);
    setCoveredFunctions(CoveredFunctions.length);
    setTotalStatement(totalStatement);
    setCoveredStatement(coveredSatatement);
    setTotalDecision(totalDecision);
    setCoveredDecision(coveredDecision);
    let codeSegments = extractCodeSegments(code);
    // codeSegments.shift();
    const nestinglevel = [];
    let finalsegment = [];
    codeSegments.forEach((element, index) => {
      if (element.includes("function")) {
        const functionDeclarationRegex = /function [^(]+\(.*\) {/;
        const statementRegex = /(.*?[;{}])/g;
        let match;
        let stat = [];
        match = functionDeclarationRegex.exec(element);
        if (match) {
          codeSegments.push(match[0]);
        }
        function extractAndPushArrays(functionString, targetArray) {
          const arrayDeclarationRegex =
            /(?:let|const|var)?\s*(\w+)\s*=\s*\[([\s\S]*?)\];/g;
          let match;
          while (
            (match = arrayDeclarationRegex.exec(functionString)) !== null
          ) {
            let arrayDeclaration = match[0];
            targetArray.push(arrayDeclaration);
          }
        }

        while ((match = statementRegex.exec(element)) !== null) {
          stat.push(match[1].trim());
        }
        let extractedArrays = [];
        extractAndPushArrays(element, extractedArrays);
        let loop = "";
        stat.forEach((element2) => {
          if (element2.includes("];")) {
            finalsegment.push(extractedArrays[0]);
            extractedArrays.shift();
          } else if (
            element2.includes("for") ||
            element2.includes("while") ||
            element2.includes("do")
          ) {
            loop += element2;
          } else if (loop !== "") {
            loop += element2;
            if (element2.includes("{")) {
              finalsegment.push(loop);
              loop = "";
            }
          } else {
            finalsegment.push(element2);
          }
        });
      } else {
        finalsegment.push(element);
      }
    });
    let nestinglevelCurrent = 0;
    finalsegment.forEach((element, index) => {
      if (element.includes("{")) {
        nestinglevel.push(nestinglevelCurrent);
        nestinglevelCurrent++;
      } else if (element.includes("}")) {
        nestinglevelCurrent--;
        nestinglevel.push(nestinglevelCurrent);
      } else {
        nestinglevel.push(nestinglevelCurrent);
      }
    });

    let functionIndex = 0;
    let functionDecision = 0;
    let functionLoop = 0;
    let Matching = [];
    let covarageindex = 0;
    let functiondata = null;
    let LastBracket = [];
    let initial = 0;
    finalsegment.forEach((element, index) => {
      console.log(element);
      if (element.includes("function")) {
        functionIndex++;
        let flag = false;
        CoveredFunctions.forEach((element2) => {
          const functionPattern1 = /function (\w+)/g;
          const matches = [...element.matchAll(functionPattern1)];
          if (element2 === matches[0][1]) {
            flag = true;
          }
        });
        const functionPattern1 = /function (\w+)/g;
        const matches = [...element.matchAll(functionPattern1)];
        const functionindex = Functions.findIndex(
          (element2) => element2.name === matches[0][1]
        );
        functiondata = Functions[functionindex];
        if (flag === true) {
          Matching.push("#3ec93e");
        } else {
          Matching.push("#b8433b");
        }
        functionDecision = 0;
        functionLoop = 0;
        covarageindex = 0;
        initial = index;
        if (element.includes("{")) {
          LastBracket.push(1);
        }
      } else if (functionIndex === 0) {
        Matching.push("#3ec93e");
      } else if (functionIndex > 0) {
        if (
          !(
            element.includes("if") ||
            element.includes("else") ||
            element.includes("for") ||
            element.includes("while") ||
            element.includes("do") ||
            element.includes("else if")
          ) ||
          element.includes("[")
        ) {
          if (LastBracket.length == 1 && element.includes("}")) {
            if (initial === index - 1) {
              initial = 0;
            } else {
              LastBracket.pop();
              Matching.push("#FFFFFF");
              functionIndex--;
            }
          } else if (element.includes("{")) {
            LastBracket.push(1);
            Matching.push("#FFFFFF");
          } else if (element.includes("}")) {
            LastBracket.pop();
            if (functiondata.s[covarageindex - 1] >= 1) {
              Matching.push("#3ec93e");
            } else {
              Matching.push("#FFFFFF");
            }
          } else {
            if (functiondata.s[covarageindex] >= 1) {
              Matching.push("#3ec93e");
            } else {
              Matching.push("#b8433b");
            }
            covarageindex++;
          }
        } else if (element.includes("if") || element.includes("else if")) {
          LastBracket.push(1);
          if (functiondata.s[covarageindex] >= 1) {
            if (
              functiondata.d[functionDecision][0] >= 1 &&
              functiondata.d[functionDecision][1] >= 1
            ) {
              Matching.push("#3ec93e");
            } else if (
              functiondata.d[functionDecision][0] >= 1 ||
              functiondata.d[functionDecision][1] === 0
            ) {
              Matching.push("yellow");
            }
          } else {
            Matching.push("#FFFFFF");
          }
          functionDecision++;
          covarageindex++;
        } else if (element.includes("else")) {
          LastBracket.push(1);
          if (functiondata.d[functionDecision - 1][1] >= 1) {
            Matching.push("#3ec93e");
          } else {
            Matching.push("#b8433b");
          }
        } else if (
          element.includes("for") ||
          element.includes("while") ||
          element.includes("do")
        ) {
          LastBracket.push(1);
          if (element.includes("for")) {
            if (
              functiondata.s[covarageindex] >= 1 &&
              functiondata.s[covarageindex + 1] >= 1
            ) {
              Matching.push("#3ec93e");
            } else {
              Matching.push("#b8433b");
            }
            covarageindex++;
          } else {
            if (functiondata.s[covarageindex] >= 1) {
              Matching.push("#3ec93e");
            } else {
              Matching.push("#b8433b");
            }
          }
          covarageindex++;
        } else if (element.includes("}") && element.includes("while")) {
          LastBracket.pop();
          if (functiondata.s[covarageindex - 1] >= 1) {
            Matching.push("#3ec93e");
          } else {
            Matching.push("#b8433b");
          }
        }
      } else {
        Matching.push("#FFFFFF");
      }
    });

    return finalsegment.map((segment, index) => {
      let space = 50 * nestinglevel[index] + 10;
      return (
        <div key={index}>
          <p
            style={{
              backgroundColor: `${Matching[index]}`,
              paddingLeft: `${space}px`,
              marginBottom: "0px",
            }}
          >
            {segment}
          </p>
        </div>
      );
    });
  }

  return (
    <>
      <h1>Report</h1>
      <button className="btn btn-primary mt-3 mb-3" onClick={downloadPDF}>
        Download PDF
      </button>
      <div id="pdf-content" ref={pdfRef}>
        <>
          <RenderCode />
        </>
        <hr />
        <h2>Coverage Details</h2>
        <div class="container mt-5 mb-5">
          <table class="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total</th>
                <th>Covered</th>
                <th>Coverage Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Functions</td>
                <td>{TotalFunctions}</td>
                <td>{CoveredFunctions}</td>
                <td>{(CoveredFunctions / TotalFunctions) * 100}%</td>
                <div style={{ width: "300px", height: "300px" }}>
                  <PieChart
                    data={generatePieChartData(
                      CoveredFunctions,
                      TotalFunctions - CoveredFunctions
                    )}
                    id="coverageChartId"
                  />
                </div>
              </tr>
              <tr>
                <td>Total Statements</td>
                <td>{TotalStatement}</td>
                <td>{CoveredStatement}</td>
                <td>{(CoveredStatement / TotalStatement) * 100}%</td>
                <div style={{ width: "300px", height: "300px" }}>
                  <PieChart
                    data={generatePieChartData(
                      CoveredStatement,
                      TotalStatement - CoveredStatement
                    )}
                    id="statementChartId"
                  />
                </div>
              </tr>
              <tr>
                <td>Total Decisions</td>
                <td>{TotalDecision}</td>
                <td>{CoveredDecision}</td>
                <td>{(CoveredDecision / TotalDecision) * 100}%</td>
                <div style={{ width: "300px", height: "300px" }}>
                  <PieChart
                    data={generatePieChartData(
                      CoveredDecision,
                      TotalDecision - CoveredDecision
                    )}
                    id="decisionChartId"
                  />
                </div>
              </tr>
              <tr>
                <td>Condition Coverage</td>
                <td>{TotalCondition}</td>
                <td>{CoveredCondition}</td>
                <td>{(CoveredCondition / TotalCondition) * 100}%</td>
                <div style={{ width: "300px", height: "300px" }}>
                  <PieChart
                    data={generatePieChartData(
                      CoveredCondition,
                      TotalCondition - CoveredCondition
                    )}
                    id="conditionChartId"
                  />
                </div>
              </tr>
            </tbody>
          </table>
        </div>
        <hr />

        <h2>Test Suites</h2>
        <h5>Statement Coverage</h5>
        {statement.Test_Cases &&
          statement.Test_Cases.map((element, index) => {
            return (
              <>
                <hr />
                <h5>Test Suite Name: {element.name}</h5>
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                      <td>Test Suite Coverage</td>
                      <td>{element.percentage}</td>
                    </tr>
                    <tr>
                      <td>Test Suite Covered Statements</td>
                      <td>{element.coveredStatements}</td>
                    </tr>
                    <tr>
                      <td>Test Suite Total Statements</td>
                      <td>{element.totalStatements}</td>
                    </tr>
                  </tbody>
                </table>
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Test Case No</th>
                      <th>Arguments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {element.Test_Cases.map((element2, index2) => {
                      return (
                        <tr key={index2}>
                          <td>{index2 + 1}</td>
                          <td>
                            {element2.Arguments.map((element3, index3) => {
                              return (
                                <p key={index3}>
                                  Argument {index3 + 1}: {element3}
                                </p>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {element.Test_Cases[0].functions_called.length > 0 && (
                  <>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Function Covered In This Test Suite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {element.Test_Cases[0].functions_called.map(
                          (element4, index4) => {
                            return (
                              <tr key={index4}>
                                <td>Function: {element4}</td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            );
          })}
        <hr className="mt-5" />

        <h4 className="mt-4">Decision Coverage Test Suites</h4>
        {decision.Test_Cases &&
          decision.Test_Cases.map((element, index) => {
            return (
              <>
                {!element.Message && (
                  <>
                    <h5>Test Suite Name: {element.name}</h5>
                    <table class="table table-bordered">
                      <tbody>
                        <tr>
                          <td>Test Suite Coverage</td>
                          <td>{element.percentage}</td>
                        </tr>
                        <tr>
                          <td>Test Suite Covered Statements</td>
                          <td>{element.totalBranchesCovered}</td>
                        </tr>
                        <tr>
                          <td>Test Suite Total Statements</td>
                          <td>{element.totalBranches}</td>
                        </tr>
                      </tbody>
                    </table>
                    {element.Test_Cases.map((element2, index2) => {
                      return (
                        <>
                          <p>Test Case No: {index2 + 1}</p>
                          <table class="table table-bordered">
                            <thead>
                              <tr>
                                <th>Argument No</th>
                                <th>Argument Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {element2.Arguments.map((element3, index3) => {
                                return (
                                  <tr key={index3}>
                                    <td>{index3 + 1}</td>
                                    <td>{element3}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </>
                      );
                    })}
                    {element.Test_Cases[0].functions_called.length > 0 && (
                      <>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Function Covered In This Test Suite</th>
                            </tr>
                          </thead>
                          <tbody>
                            {element.Test_Cases[0].functions_called.map(
                              (element4, index4) => {
                                return (
                                  <tr key={index4}>
                                    <td>Function: {element4}</td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                )}
                {element.Message && (
                  <>
                    <h4>Test Suite Name: {element.name}</h4>
                    <p>Decision Coverage Was Not Possible for this Function</p>
                  </>
                )}
              </>
            );
          })}
        <hr />
        <h4 className="mt-5">Condition Coverage Test Suites</h4>
        {condition.Test_Cases &&
          condition.Test_Cases.map((element, index) => {
            return (
              <>
                {!element.Message && (
                  <>
                    <h4>Test Suite Name: {element.name}</h4>
                    <table class="table table-bordered">
                      <tbody>
                        <tr>
                          <td>Test Suite Coverage</td>
                          <td>{element.percentage}</td>
                        </tr>
                        <tr>
                          <td>Test Suite Covered Statements</td>
                          <td>{element.totalBranchesCovered}</td>
                        </tr>
                        <tr>
                          <td>Test Suite Total Statements</td>
                          <td>{element.totalBranches}</td>
                        </tr>
                      </tbody>
                    </table>
                    {element.Test_Cases.map((element2, index2) => {
                      return (
                        <>
                          <p>Test Case No: {index2 + 1}</p>
                          <table class="table table-bordered">
                            <thead>
                              <tr>
                                <th>Argument No</th>
                                <th>Argument Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {element2.Arguments.map((element3, index3) => {
                                return (
                                  <tr key={index3}>
                                    <td>{index3 + 1}</td>
                                    <td>{element3}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </>
                      );
                    })}
                    {element.Test_Cases[0].functions_called.length > 0 && (
                      <>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Function Covered In This Test Suite</th>
                            </tr>
                          </thead>
                          <tbody>
                            {element.Test_Cases[0].functions_called.map(
                              (element4, index4) => {
                                return (
                                  <tr key={index4}>
                                    <td>Function: {element4}</td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                )}
                {element.Message && (
                  <>
                    <h4>Test Suite Name: {element.name}</h4>
                    <p>Condition Coverage Was Not Possible for this Function</p>
                  </>
                )}
              </>
            );
          })}
        <hr />
        <h4 className="mt-5">MCDC Coverage Test Suites</h4>
        {condition.Test_Cases &&
          condition.Test_Cases.map((element, index) => {
            return (
              <>
                {!element.Message && (
                  <>
                    <h5>Test Suite Name: {element.name}</h5>
                    <p>Test Cases</p>
                    {element.Test_Cases.map((element2, index2) => {
                      return (
                        <>
                          <p>Test Case No: {index2 + 1}</p>
                          <table class="table table-bordered">
                            <thead>
                              <tr>
                                <th>Argument No</th>
                                <th>Argument Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {element2.Arguments.map((element3, index3) => {
                                return (
                                  <tr key={index3}>
                                    <td>{index3 + 1}</td>
                                    <td>{element3}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </>
                      );
                    })}
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Function Covered In This Test Suite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {element.Test_Cases[0].functions_called.map(
                          (element4, index4) => {
                            return (
                              <tr key={index4}>
                                <td>Function: {element4}</td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </>
                )}
                {element.Message && (
                  <>
                    <h4>Test Suite Name: {element.name}</h4>
                    <p>MCDC Coverage Was Not Possible for this Function</p>
                  </>
                )}
              </>
            );
          })}
      </div>
    </>
  );
};

export default Report;
