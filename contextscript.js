'use strict';

const hideFoes = async () => {
    await chrome.storage.local.get('foeList', result => {
        result.foeList && result.foeList.forEach(foe => {
            $(`blockquote cite a:contains(${foe.name})`).each((index, el) => {
                const $div = $(el).parent().parent();
                $div.parent().append(`
                    <div class="ignore-message">
                        <a href="./memberlist.php?mode=viewprofile&amp;u=${foe.value}" style="color: #888888;" class="username-coloured">${foe.name}</a>
                        <span>die momenteel op je negeerlijst staat, is geciteerd in dit bericht.</span>
                        <a class="remove-ignore" style="cursor: pointer;">Dit bericht weergeven</a>
                    </div>
                `);
                $div.wrap('<div class="ignored" style="display:none !important;"></div>');
            });
        });
    });
}

$(document).ready(async () => {
    hideFoes();
});

$(document).on('click', '.remove-ignore', e => {
    const $link = $(e.target);
    $link.parent().parent().find('.ignored > div').unwrap();
    $link.parent().remove();
});