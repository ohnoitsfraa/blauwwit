import type { PlasmoCSConfig } from "plasmo";
import { Storage } from '@plasmohq/storage';
import extConfig from "./extConfig.json"

const parser = new DOMParser();
const storage = new Storage();

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
                        <a href="./memberlist.php?mode=viewprofile&amp;u=${foe.value}" class="username-coloured">${foe.name}</a>
                        <span>die momenteel op je negeerlijst staat, is geciteerd in dit bericht.</span>
                        <a class="remove-ignore post">Dit bericht weergeven</a>
                    </div>
                    `,
                    "text/html"
                )
                div.parentElement.appendChild(ignoreMessageElement.body.firstChild)
                const wrapperElement = parser.parseFromString(
                    `<div class="ignored"></div>`,
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
                                <a class="remove-ignore topic">Topic weergeven</a>
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

const showTopics = async () => {
    document.querySelectorAll('a.topictitle').forEach(link => {
        const dl = link.parentElement.parentElement.parentElement;
        dl.classList.remove('hide');
        dl.style.paddingTop = null;
        dl.style.paddingBottom = null;
        dl.removeAttribute('data-topic-value');
        const ignoreMessage = dl.parentElement.querySelector('.ignore-message');
        if (ignoreMessage) {
            dl.parentElement.removeChild(ignoreMessage);
        }
    });
}

const showHideTopicToggles = () => {
    document.querySelectorAll('a.topictitle, .topic-title a').forEach((topicTitle) => {
        if (topicTitle.classList.toString().indexOf('hide-enabled') > 0) {
            return;
        }
        const hideTopicAnchor = parser.parseFromString(
            `<i class="hide-topic icon fa-ban fa-fw"></i>`,
            "text/html"
        ).body.firstChild
        insertAfter(topicTitle, hideTopicAnchor);
        topicTitle.classList.add('hide-enabled');
    })
};

const watchStorage = () => {
    storage.watch({
        'hiddenTopics': () => {
            showTopics();
            hideTopics();
        }
    });
}

const showFoeToggles = () => {
    document.querySelectorAll('.postprofile .username-coloured').forEach(username => {
        const url = new URL(extConfig.ucpUrl);
        const params = new URLSearchParams(url.search);
        params.set('addUsername', username.textContent);
        url.search = params.toString();
        insertAfter(username, parser.parseFromString(
            `<a href="${url.toString()}">
                <i class="icon hide-user fa-ban fa-fw"></i>
            </a>`,
            'text/html'
        ).body.firstChild);
    });
}

const listenToUCPChange = () => {
    if (window.location.href.indexOf(extConfig.ucpUrl) >= 0) {
        const currentUrl = new URL(window.location.href);
        const currentParams = new URLSearchParams(currentUrl.search);
        const addUsername = currentParams.get('addUsername');
        const removeUsername = currentParams.get('removeUsername');
        const confirmForm = document.querySelector('form#confirm');
        const confirmKey = currentParams.get('confirm_key');
        if (addUsername && addUsername.length > 0) {
            const textarea = document.querySelector('textarea[name="add"]');
            textarea.textContent = addUsername;
            const submit = (<HTMLButtonElement>document.querySelector('form#ucp input[type="submit"]'));
            submit.click();
        } else if (removeUsername && removeUsername.length > 0) {
            document.querySelectorAll('select[name="usernames[]"] option').forEach(option => {
                if (option.textContent == removeUsername) {
                    (<HTMLSelectElement>option.parentElement).value = (<HTMLOptionElement>option).value;
                    const submit = (<HTMLButtonElement>document.querySelector('form#ucp input[type="submit"]'));
                    submit.click();
                }
            });
        } else if (confirmForm) {
            (<HTMLButtonElement>confirmForm.querySelector('input[type="submit"]')).click();
        } else if (confirmKey) {
            window.location.href = extConfig.ucpUrl;
        }
    }
}

const injectStyle = () => {
    const styleElement = parser.parseFromString(
        `
        <style>
            .ignored {
                display:none !important;
            }
            .ignore-message {
                color: #888888;
            }

            .hide-topic,
            .remove-ignore {
                cursor: pointer;
            }

            .hide-topic {
                margin-left: 10px;
                text-decoration: none;
                font-size: 14px;
                transition: 200ms transform ease-in-out;
                color: #CCCCCC;
            }

            @media (max-width: 700px) {
                .hide-topic {
                    font-size: 16px;
                }
            }
            
            .hide-user:hover,
            .hide-topic:hover {
                transform: scale(1.4);
            }

            .remove-ignore {
                margin-left: 5px;
            }

            .hide-user {
                color: #CCCCCC;
                margin-left: 10px;
            }
        </style>`,
        'text/html'
    ).head.firstChild;
    document.head.append(styleElement);
}

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
);

injectStyle();
hideFoes();
showHideTopicToggles();
showFoeToggles();
showTopics();
hideTopics();
watchStorage();
listenToUCPChange();