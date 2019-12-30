/*!
 * Plugin Name: GIPHY Button
 * Plugin URI:  http://ellitest.proboards.com
 * Author:      Elli
 * Author URI:  http://ellimccale.com/
 * Version:     0.0.1
 */

(function() {

    var PLUGIN_ID = 'giphy_button';
    var ELEMENT_ID = 'giphy-button';
    var DIALOG_ID = 'js-' + ELEMENT_ID + '-dialog';
    var GIPHY_API = 'https://api.giphy.com/v1/gifs/search';

    var settings = {};
    var images = {};

    var route = pb.data('route');
    var wysiwyg = null;

    function _init() {
        _getSettings();
        $(_onDocumentReady);
    }

    function _getSettings() {

        var plugin = pb.plugin.get(PLUGIN_ID);

        if (plugin && plugin.settings) {
            settings = plugin.settings;
            images = plugin.images;
        }

    }

    function _onDocumentReady() {

        var isPostingPage = (
            route.name === 'quote_posts' ||
            route.name === 'new_post'    ||
            route.name === 'new_thread'  ||
            route.name === 'edit_post'   ||
            route.name === 'edit_thread'
        );

        if (isPostingPage) {
            $(document).on('wysiwygcreate', function(e) {

                wysiwyg = $(e.target).data('wysiwyg');

                _buildGifButton();
                _buildDialog();

            });
        }

    }

    function _buildGifButton() {

        var $editorControls = $('.controls .visual-editor, .controls .bbcode-editor');
        var $imageButton = $editorControls.find('[data-control="insertImage"]');

        var $gifButton = $('<li>').attr({
            class: 'button button-insertGif',
            title: 'Insert GIF',
            'data-control': 'insertGif',
        }).html('<img alt="" src="' + images.buttongiphypb26x22 + '">');

        $gifButton.on('click', function() {
            $('#' + DIALOG_ID).dialog('open');
        });

        $imageButton.after($gifButton);

    }

    function _buildDialog() {

        pb.window.dialog(DIALOG_ID, {

            autoOpen: false,
            buttons: {
                'Insert GIF': function() {

                    var gif = $('#js-' + ELEMENT_ID + '-gif ').find('img').attr('src');

                    if (gif) {
                        _insertGif(gif);
                        $(this).dialog('close');
                    }

                },
            },
            draggable: true,
            height: 350,
            html: _buildDialogContent(),
            resizable: true,
            title: 'Insert GIF',
            width: 500,

        });

    }

    function _buildDialogContent() {

        var $gifContainer = $('<div>').attr({
            id: 'js-' + ELEMENT_ID + '-gif',
            class: ELEMENT_ID + '__gif',
        });

        var $searchLabel = $('<label>')
            .attr('class', 'visually-hidden')
            .text('Search GIPHY');

        var $searchField = $('<input>').attr({
            class: ELEMENT_ID + '__search-field',
            type: 'search',
            placeholder: 'Search GIPHY',
        });

        var $searchButton = $('<button>').attr({
            class: ELEMENT_ID + '__button ' + ELEMENT_ID + '__button--search',
            type: 'button',
        }).html('<img src="' + images.iconsearch21x22 + '" alt="">');

        var $shuffleButton = $('<button>').attr({
            class: ELEMENT_ID + '__button ' + ELEMENT_ID + '__button--shuffle',
            type: 'button',
        }).text('Shuffle');

        var searchVal = '';

        $searchButton.on('click', function() {

            var currentVal = $searchField.val();

            if (searchVal !== currentVal) {
                searchVal = currentVal;
                _fetchGifs(searchVal, function(gifs) {
                    $gifContainer.html(_generateRandomGif(gifs));
                });
            }

        });

        $shuffleButton.on('click', function() {

            var currentVal = $searchField.val();

            if (searchVal === currentVal) {
                _fetchGifs($searchField.val(), function(gifs) {
                    $gifContainer.html(_generateRandomGif(gifs));
                });
            }

        });

        return $('<div>')
            .append($gifContainer)
            .append($searchLabel)
            .append($searchField)
            .append($searchButton)
            .append($shuffleButton);

    }

    function _fetchGifs(searchTerm, storeGifs) {

        $.getJSON(GIPHY_API, {
            api_key: 'Mpj7IqNxtW6QbpDx61TAjA9pe88I1z3d',
            q: searchTerm,
            limit: 20,
        }).done(function(response) {

            var meta = response.meta;
            var data = response.data;

            if (meta.status === 200) {

                var gifs = [];

                $.each(data, function(index, value) {

                    var $newImage = $('<img>').attr({
                        'alt': '',
                        'src': value.images.fixed_height.url,
                    });

                    gifs.push($newImage);

                });

                storeGifs(gifs);

            }

        }).fail(function(jqxhr, textStatus, error) {
            console.error('Unable to call the GIPHY API: ' + error + ', ' + textStatus);
        });

    }

    function _generateRandomGif(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function _insertGif(img) {

        var currentEditor = null;
        var gif = '[img src="' + img + '" alt=""]';

        if (wysiwyg) {
            if (wysiwyg.currentEditorName === 'visual') {
                currentEditor = wysiwyg.editors['visual'];
                gif = $('<img src="' + img + '" alt="">', wysiwyg.editors['visual'].document)[0];
            } else {
                currentEditor = wysiwyg.editors['bbcode'];
            }
        }

        if (currentEditor) {
            currentEditor.replaceSelection(gif);
        }

    }

    _init();

})();