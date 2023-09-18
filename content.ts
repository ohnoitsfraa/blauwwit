import type { PlasmoCSConfig } from "plasmo"
import { Storage } from '@plasmohq/storage';

import extConfig from "./extConfig.json"

const parser = new DOMParser()
const storage = new Storage()

export const config: PlasmoCSConfig = {
    matches: ["https://www.blauwwit.be/*"]
}

function wrap(el, wrapper) {
    if (el && el.parentNode) {
        el.parentNode.insertBefore(wrapper, el)
        wrapper.appendChild(el)
    }
}

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}

const hideFoes = async () => {
    const result = await (await fetch(extConfig.ucpUrl)).text()
    const htmlResult = parser.parseFromString(result, "text/html")
    htmlResult.documentElement
        .querySelectorAll('select[name="usernames[]"] option')
        .forEach((node) => {
            const foe = {
                value: node.getAttribute("value"),
                name: node.innerHTML
            }
            document.querySelectorAll(`blockquote cite a`).forEach((link) => {
                console.log(`Found blauwwit quote by foe: ${foe.name}`)
                if (link.textContent.indexOf(foe.name) < 0) {
                    return
                }
                const div = link.parentElement.parentElement
                const ignoreMessageElement = parser.parseFromString(
                    `<div class="ignore-message">
                        <a href="./memberlist.php?mode=viewprofile&amp;u=${foe.value}" style="color: #888888;" class="username-coloured">${foe.name}</a>
                        <span>die momenteel op je negeerlijst staat, is geciteerd in dit bericht.</span>
                        <a class="remove-ignore post" style="cursor: pointer;">Dit bericht weergeven</a>
                    </div>
                    `,
                    "text/html"
                )
                div.parentElement.appendChild(ignoreMessageElement.body.firstChild)
                const wrapperElement = parser.parseFromString(
                    `<div class="ignored" style="display:none !important;"></div>`,
                    "text/html"
                )
                wrap(div, wrapperElement.body.firstChild)
            })
        })
};

const hideTopics = async () => {
    let hiddenTopics: any[] = await storage.get('hiddenTopics') || [];
    if (hiddenTopics) {
        hiddenTopics.forEach(topic => {
            const selector = `a.topictitle[href$="${topic.url}"]`;
            document.querySelectorAll(selector).forEach(link => {
                try {
                    const dl = link.parentElement.parentElement.parentElement;
                    dl.classList.add('hide');
                    dl.style.paddingTop = '2px';
                    dl.style.paddingBottom = '2px';
                    dl.setAttribute('data-topic-value', topic.value);
                    const exists = dl.parentElement.querySelectorAll('.ignore-message');
                    if (!(exists && exists.length > 0)) {
                        dl.parentElement.appendChild(
                            parser.parseFromString(
                                `<div class="ignore-message">
                                    <span>Dit topic staat op je negeerlijst</span>
                                    <a class="remove-ignore topic" style="cursor: pointer;">Dit topic verwijderen van je negeerlijst en weergeven</a>
                                </div>`,
                                'text/html').body.firstChild);
                    }
                } catch (e) {
                    console.log('dl not found for: ', link);
                }

            });
        });
    }
}

const showHideTopicToggles = () => {
    document.querySelectorAll('a.topictitle, .topic-title a').forEach((topicTitle) => {
        const hideTopicAnchor = parser.parseFromString(
            `<svg class="hide-topic" fill="#888888" height="10px" width="10px" style="cursor:pointer;margin-left:5px;text-decoration:none;" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 65.518 65.518" xml:space="preserve"><g><path d="M32.759,0C14.696,0,0,14.695,0,32.759s14.695,32.759,32.759,32.759s32.759-14.695,32.759-32.759S50.822,0,32.759,0z M6,32.759C6,18.004,18.004,6,32.759,6c6.648,0,12.734,2.443,17.419,6.472L12.472,50.178C8.443,45.493,6,39.407,6,32.759z M32.759,59.518c-5.948,0-11.447-1.953-15.895-5.248l37.405-37.405c3.295,4.448,5.248,9.947,5.248,15.895 C59.518,47.514,47.514,59.518,32.759,59.518z"/></g></svg>`,
            "text/html"
        ).body.firstChild
        insertAfter(topicTitle, hideTopicAnchor)
    })
};

const watchStorage = () => {
    storage.watch({
        'hiddenTopics': () => {
            hideTopics();
        }
    });
}

window.addEventListener("load", () => {
    hideFoes()
    showHideTopicToggles();
    hideTopics();
    watchStorage();
});

document.addEventListener(
    "click",
    async function (event) {
        const target = <HTMLElement>event.target
        if (target.matches(".remove-ignore")) {
            event.preventDefault()
            if (target.matches('.topic')) {
                const dl = target.parentElement.parentElement.querySelector('dl');
                dl.classList.remove('hide');
                const ignored = dl.parentElement.querySelector('.ignore-message');
                dl.parentElement.removeChild(ignored);
                let hiddenTopics: any[] = await storage.get('hiddenTopics') || [];
                const topicValue = parseInt(dl.getAttribute('data-topic-value'));
                const index = hiddenTopics.findIndex(hiddenTopic => hiddenTopic.value === topicValue);
                hiddenTopics.splice(index, 1);
                await storage.set('hiddenTopics', hiddenTopics);
            } else if (target.matches('.post')) {
                const blockQuote = target.parentElement.parentElement;
                const div = blockQuote.querySelector(".ignored > div")
                const ignored = blockQuote.querySelector(".ignored")
                blockQuote.prepend(div)
                blockQuote.removeChild(ignored)
                const parent = target.parentElement
                parent.parentElement.removeChild(parent)
            }
        } else if (target.matches(".hide-topic")) {
            event.preventDefault()
            const anchor = <HTMLElement>target.previousSibling
            if (anchor) {
                let href = anchor.getAttribute("href");
                if (href.charAt(0) === '.') {
                    href = href.slice(1);
                }
                const url = new URL(location.origin + href);
                const urlParams = new URLSearchParams(url.search);
                const topicId = urlParams.get('t');
                let hiddenTopics: any[] = await storage.get('hiddenTopics') || [];
                const exists = hiddenTopics.find(topic => topic.value === topic);
                if (!exists) {
                    hiddenTopics.push({
                        value: topicId,
                        title: anchor.innerText,
                        url: anchor.getAttribute("href"),
                        absUrl: url
                    });
                }
                storage.set('hiddenTopics', hiddenTopics);
            }
        }
    },
    false
)
