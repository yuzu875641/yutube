$(function () {
    // オートコンプリート機能
    $('#searchbox').autocomplete({
        source: function (request, response) {
            let searchTerm = request.term.trim();
            if (searchTerm.length > 0) {
                $.ajax({
                    url: '/api/suggest',
                    data: { keyword: searchTerm },
                    success: function (data) {
                        response(data.length > 0 ? data : getSearchHistory());
                    }
                });
            } else {
                response(getSearchHistory());
            }
        },
        delay: 1,
        minLength: 0,
        select: function (event, ui) {
            $('#searchbox').val(ui.item.value);
            $('#searchForm').submit();
        }
    });

    // 検索履歴の取得
    function getSearchHistory() {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }

    // 検索フォーム送信時に履歴を保存
    $('#searchForm').on('submit', function() {
        let history = getSearchHistory();
        const searchTerm = $('#searchbox').val();
        if (searchTerm && !history.includes(searchTerm)) {
            history.unshift(searchTerm);
            if (history.length > 10) history.pop(); // 最新10件を保持
            localStorage.setItem('searchHistory', JSON.stringify(history));
        }
    });

    // 検索ボックスにフォーカスが当たったときにオートコンプリートを起動
    $('#searchbox').on('focus', function () {
        const q = $(this).val();
        $(this).autocomplete('search', q);
    });
});
