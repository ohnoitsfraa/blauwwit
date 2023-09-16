import type { PlasmoCSConfig } from "plasmo"
import extConfig from './extConfig.json';

export const config: PlasmoCSConfig = {
    matches: ["https://www.blauwwit.be/*"]
}

function wrap(el, wrapper) {
    if (el && el.parentNode) {
        el.parentNode.insertBefore(wrapper, el)
        wrapper.appendChild(el)
    }
}

function unwrap(el) {
    if (el && el.parentNode) {
        // move all children out of the element
        while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el)
        }
        // remove the empty element
        el.remove()
    }
}

const hideFoes = async () => {
    const result = await (await fetch(extConfig.ucpUrl)).text()
    const parser = new DOMParser()
    const htmlResult = parser.parseFromString(result, "text/html")
    htmlResult.documentElement
        .querySelectorAll('select[name="usernames[]"] option')
        .forEach((node) => {
            const foe = {
                value: node.getAttribute("value"),
                name: node.innerHTML
            }
            console.log(`Found blauwwit quote by foe: ${foe.name}`);
            document.querySelectorAll(`blockquote cite a`).forEach((link) => {
                if (link.textContent.indexOf(foe.name) < 0) {
                    return
                }
                const div = link.parentElement.parentElement
                const ignoreMessageElement = parser.parseFromString(
                    `<div class="ignore-message">
                        <a href="./memberlist.php?mode=viewprofile&amp;u=${foe.value}" style="color: #888888;" class="username-coloured">${foe.name}</a>
                        <span>die momenteel op je negeerlijst staat, is geciteerd in dit bericht.</span>
                        <a class="remove-ignore" style="cursor: pointer;">Dit bericht weergeven</a>
                    </div>
                    `,
                    "text/html"
                )
                div.parentElement.appendChild(ignoreMessageElement.body.firstChild)
                const wrapperElement = parser.parseFromString(
                    `<div class="ignored" style="display:none !important;"></div>`,
                    "text/html"
                )
                wrap(div, wrapperElement.body.firstChild);
            })
        })
}

window.addEventListener("load", () => {
    hideFoes()
})

document.addEventListener(
    "click",
    function (event) {
        const target = <HTMLElement>event.target
        if (target.matches(".remove-ignore")) {
            event.preventDefault()
            const blockQuote = target.parentElement.parentElement;
            const div = blockQuote.querySelector(".ignored > div");
            const ignored = blockQuote.querySelector('.ignored');
            blockQuote.prepend(div);
            blockQuote.removeChild(ignored);
            const parent = target.parentElement
            parent.parentElement.removeChild(parent)
        }
    },
    false
)
