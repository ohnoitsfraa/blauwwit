'use strict';

const ucpUrl = 'https://www.blauwwit.be/ucp.php?i=ucp_zebra&mode=foes';

const hideFoes = () => {
    $.get(ucpUrl, data => {
        const $result = $(data);
        $result.find('select[name="usernames[]"] option').each((index, el) => {
            const foe = {
                value: $(el).val(),
                name: $(el).text()
            };
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