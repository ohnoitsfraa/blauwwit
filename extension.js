'use strict';
const ucpUrl = 'https://www.blauwwit.be/ucp.php?i=ucp_zebra&mode=foes';

(async () => {
    $(document).on('click', 'button#goto', e => {
        chrome.tabs.create({
            url: ucpUrl
        });
    });
    $.get(ucpUrl, data => {
        const $result = $(data);
        const foeList = [];
        $result.find('select[name="usernames[]"] option').each((index, el) => {
            foeList.push({
                value: $(el).val(),
                name: $(el).text()
            });
        });
        $('ul#foelist').html(foeList.map(item => `<li data-value="${item.value}">${item.name}</li>`));
    });
})();
