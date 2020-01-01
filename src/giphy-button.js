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

                _buildButton();
                _buildDialog();
                _handleSearch();

            });
        }

    }

    function _buildButton() {

        var $editorControls = $('.controls .visual-editor, .controls .bbcode-editor');
        var $imageButton = $editorControls.find('[data-control="insertImage"]');

        var $gifButton = $('<li>', {
            'class': 'button button-insertGif',
            'title': 'Insert GIF',
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

                    var gif = $('#js-' + ELEMENT_ID + '-gif').find('img').attr('src');

                    if (gif) {
                        _insertGif(gif);
                        $(this).dialog('close');
                    }

                },
            },
            draggable: true,
            height: 353,
            html: _buildDialogContent(),
            resizable: true,
            title: 'Insert GIF',
            width: 400,

        });

    }

    function _buildDialogContent() {

        var content = [
            '<div id="js-' + ELEMENT_ID + '-gif" class="' + ELEMENT_ID + '__gif"></div>',
            '<div class="' + ELEMENT_ID + '__search">',
            '  <label class="visually-hidden" for="js-' + ELEMENT_ID + '-search-field">Enter a search term</label>',
            '  <input id="js-' + ELEMENT_ID + '-search-field" class="' + ELEMENT_ID +'__search-field" type="search" placeholder="Search GIPHY">',
            '  <button id="js-' + ELEMENT_ID + '-search-button" class="' + ELEMENT_ID + '__button ' + ELEMENT_ID + '__button--search" type="button" title="Search GIPHY">',
            '    <img src="' + images.iconsearch20x20 + '" alt="" aria-hidden="true">',
            '  </button>',
            '  <button id="js-' + ELEMENT_ID + '-shuffle-button" class="' + ELEMENT_ID + '__button ' + ELEMENT_ID + '__button--shuffle" type="button" title="Shuffle gifs based on the current search term">',
            '    Shuffle',
            '  </button>',
            '</div>',
        ];

        return content.map(function(str) {
            return str.trim();
        }).join('');

    }

    function _handleSearch() {

        var hasClickedSearch = false;
        var searchVal = '';

        var $gifContainer = $('#js-' + ELEMENT_ID + '-gif');
        var $searchField = $('#js-' + ELEMENT_ID + '-search-field');
        var $searchButton = $('#js-' + ELEMENT_ID + '-search-button');
        var $shuffleButton = $('#js-' + ELEMENT_ID + '-shuffle-button');

        $shuffleButton.hide();

        function _generateRandomGif(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function _handleFetch() {
            _fetchGifs(searchVal, function(gifs) {
                $gifContainer.html(_generateRandomGif(gifs));
            });
        }

        $searchButton.on('click', function() {

            var currentVal = $searchField.val();

            if (searchVal !== currentVal) {

                hasClickedSearch = true;
                searchVal = currentVal;

                $gifContainer.height(210);

                _handleFetch();

            }

            if (hasClickedSearch) {
                $shuffleButton.show();
            }

        });

        $shuffleButton.on('click', function() {
            searchVal = $searchField.val();
            _handleFetch();
        });

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

                $.each(data, function(index, giphy) {

                    var $newImage = $('<img>', {
                        'alt': '',
                        'src': giphy.images.fixed_height.url,
                    });

                    gifs.push($newImage);

                });

                storeGifs(gifs);

            }

        }).fail(function(jqxhr, textStatus, error) {
            console.error('Unable to call the GIPHY API: ' + error + ', ' + textStatus);
        });

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