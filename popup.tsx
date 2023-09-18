import { useEffect, useState } from "react";
import { Storage } from '@plasmohq/storage';
import extConfig from './extConfig.json';

function IndexPopup() {
  const [foes, setFoes] = useState([]);
  const [hiddenTopics, setHiddenTopics] = useState([]);
  const storage = new Storage()

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
    setFoes(foes);
  }

  async function getHiddenTopics(): Promise<void> {
    setHiddenTopics(await storage.get('hiddenTopics'));
    console.log(hiddenTopics);
  }

  function goToHandleClick(url): void {
    window.open(url, '_blank');
  }

  async function deleteHandleClick(topic): Promise<void> {
    if (typeof topic === 'undefined') {
      await storage.set('hiddenTopics', [])
      setHiddenTopics([]);
    } else {
      const index = hiddenTopics.findIndex(hiddenTopic => hiddenTopic.value === topic.value);
      hiddenTopics.splice(index, 1);
      await storage.set('hiddenTopics', hiddenTopics);
    }

    getHiddenTopics();
  }

  function watchStorage(): void {
    storage.watch({
      'hiddenTopics': () => getHiddenTopics()
    });
  }

  useEffect(() => {
    getFoes();
    getHiddenTopics();
    watchStorage();
  }, [])

  return (
    <div
      style={{
        display: "flex",
        fontFamily: 'Verdana sans-serif',
        flexDirection: "column",
        padding: 16,
        minWidth: 320,
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
      <p style={{
          fontFamily: "Verdana, Helvetica, Arial, sans-serif",
          fontSize: 14,
          marginTop: 10,
          marginBottom: 0,
          color: '#FFF',
          opacity: '0.3',
          letterSpacing: 2
        }}>GENEGEERDE GEBRUIKERS {foes ? `(${foes.length})` : ''}</p>
      {foes && foes.length > 0 ? (
        <div>
          <ul id="foelist" style={{
            paddingLeft: 0,
            maxHeight: 150,
            overflowY: 'auto'
          }}>
            {foes.map(foe => {
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
        fontFamily: "Verdana, Helvetica, Arial, sans-serif",
        borderRadius: 3,
        background: 'transparent',
        border: 'none',
        textDecoration: 'underline',
        color: "#DDDDDD",
        cursor: "pointer",
        padding: 0,
        textAlign: 'left',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 10
      }} id="goto" onClick={() => goToHandleClick(extConfig.ucpUrl)}>Ga naar negeerlijst</button>
      <hr style={{
        width: '100%',
        opacity: 0.3,
        marginTop: 10,
        marginBottom: 10
        }}/>
      <p style={{
          fontFamily: "Verdana, Helvetica, Arial, sans-serif",
          fontSize: 14,
          marginTop: 10,
          marginBottom: 0,
          color: '#FFF',
          opacity: '0.3',
          letterSpacing: 2
        }}>GENEGEERDE TOPICS {hiddenTopics ? `(${hiddenTopics.length})` : ''}</p>
      {hiddenTopics && hiddenTopics.length > 0 ? (
        <div>
          <ul id="topiclist" style={{
            paddingLeft: 0,
            maxHeight: 150,
            overflowY: 'auto'
          }}>
            {hiddenTopics.map(topic => {
              return <li style={{
                fontFamily: "Verdana, Helvetica, Arial, sans-serif",
                fontSize: 12,
                listStyle: 'none',
                marginTop: 5,
                marginBottom: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }} data-value={topic.value} key={topic.value}>
                <a onClick={() => goToHandleClick(topic.absUrl)} style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  flexBasis: 'calc(100% - 30px)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  textOverflow: 'ellipsis'
                }}>{topic.title}</a>
                <button style={{
                  border: "1px solid #31567B",
                  borderRadius: 3,
                  background: "#011623",
                  color: "#DDDDDD",
                  cursor: "pointer",
                  fontSize: "1em",
                  marginTop: 10,
                  marginBottom: 10,
                  padding: 0,
                  margin: 0,
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} id="deleteTopics" onClick={() => deleteHandleClick(topic)}>x</button>
              </li>
            })}
          </ul>
          <button style={{
            width: '100%',
            border: "1px solid #31567B",
            borderRadius: 3,
            background: "#011623",
            color: "#DDDDDD",
            cursor: "pointer",
            padding: "10px 8px",
            fontSize: "1.1em",
            marginTop: 10,
            marginBottom: 10
          }} id="deleteTopics" onClick={() => deleteHandleClick(undefined)}>Verwijder alle topics</button>
        </div>) : null
      }
    </div>
  )
}

export default IndexPopup
