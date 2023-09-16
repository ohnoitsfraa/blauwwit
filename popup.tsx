import { useEffect, useState } from "react"
import extConfig from './extConfig.json';

function IndexPopup() {
  const [data, setData] = useState([])

  async function getFoes(): Promise<void> {
    const result = await (await fetch(extConfig.ucpUrl)).text()
    const parser = new DOMParser()
    const htmlResult = parser.parseFromString(result, "text/html")
    const foes = [];
    htmlResult.documentElement
      .querySelectorAll('select[name="usernames[]"] option')
      .forEach((node) => {
        const foe = {
          value: node.getAttribute("value"),
          name: node.innerHTML
        }
        foes.push(foe);
      });
    setData(foes);
  }

  function handleClick(): void {
    window.open(extConfig.ucpUrl, '_blank');
  }

  useEffect(() => {
    getFoes();
  }, [])

  return (
    <div
      style={{
        display: "flex",
        fontFamily: 'Verdana sans-serif',
        flexDirection: "column",
        padding: 16,
        minWidth: 200,
        background: "radial-gradient(ellipse at center, rgba(37, 99, 151, 1) 0%, rgba(37, 99, 151, 1) 15%, rgba(8, 49, 75, 1) 100%)",
        color: '#FFF',
        margin: 0
      }}>
      <h1 style={{
        fontFamily: "Verdana, Helvetica, Arial, sans-serif",
        fontSize: "2.2em",
        marginTop: 5,
        textShadow: "2px 2px 4px #004174",
        marginBottom: 0
      }}>
        <span style={{
          color: "#039be5"
        }}>Blauw</span><span style={{
          color: "#FFF"
        }}>wit</span><span style={{
          fontSize: "0.5em"
        }}>.be</span></h1>
      {data && data.length > 0 ? (
        <div>
          <p style={{
            fontFamily: "Verdana, Helvetica, Arial, sans-serif",
            fontSize: 20,
            marginTop: 10,
            marginBottom: 0,
            color: '#FFF',
            opacity: '0.3',
            letterSpacing: 4
          }}>NEGEERLIJST</p>
          <ul id="foelist" style={{
            paddingLeft: 5
          }}>
            {data.map(foe => {
              return <li style={{
                fontFamily: "Verdana, Helvetica, Arial, sans-serif",
                fontSize: 12,
                listStyle: 'none',
                marginTop: 5,
                marginBottom: 5
              }} data-value={foe.value} key={foe.value}>{foe.name}</li>
            })}
          </ul>
        </div>) : null
      }
      <button style={{
        border: "1px solid #31567B",
        borderRadius: 3,
        background: "#011623",
        color: "#DDDDDD",
        cursor: "pointer",
        padding: "10px 8px",
        fontSize: "1.1em",
        marginTop: 10
      }} id="goto" onClick={() => handleClick()}>Ga naar negeerlijst</button>
    </div>
  )
}

export default IndexPopup
