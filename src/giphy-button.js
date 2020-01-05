/*!
 * Plugin Name: GIPHY Button
 * Plugin URI:  http://ellitest.proboards.com
 * Author:      Elli
 * Author URI:  http://ellimccale.com/
 * Version:     0.0.1
 */

(function() {

    var PLUGIN_ID = 'giphy_button';
    var GIPHY_API = 'https://api.giphy.com/v1/gifs/search';

    var settings = {};
    var images = {};

    var route = pb.data('route');
    var hasWysiwyg = null;
    var hasQuickReply = pb.data('quick_reply');
    var showQuickReply = null;

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

        showQuickReply = (settings.show_quick_reply === 'true');

        if (isPostingPage) {

            $(document).on('wysiwygcreate', function(e) {

                hasWysiwyg = $(e.target).data('wysiwyg');

                _buildButton();
                _buildDialog();
                _handleSearch();

            });

        } else if (hasQuickReply && showQuickReply) {
            _buildButton();
            _buildDialog();
            _handleSearch();
        }

    }

    function _buildButton() {

        var $appendAfterElement = null;

        var $gifButtonImage = $('<img>', {
            'src': '',
            'alt': '',
        });

        var $gifButton = null;

        if (hasWysiwyg) {

            var $editorControls = $('.controls .visual-editor, .controls .bbcode-editor');
            $appendAfterElement = $editorControls.find('[data-control="insertImage"]');

            var selectedImage = settings.button_image;

            if (settings.button_custom_image.length) {
                $gifButtonImage.attr('src', settings.button_custom_image);
            } else if (selectedImage === 'button_cool') {
                $gifButtonImage.attr('src', images.buttongiphycool26x22);
            } else if (selectedImage === 'button_warm') {
                $gifButtonImage.attr('src', images.buttongiphywarm26x22);
            } else if (selectedImage === 'button_black') {
                $gifButtonImage.attr('src', images.buttongiphyicon26x22);
            } else {
                $gifButtonImage.attr('src', images.buttongiphypb26x22);
            }

            $gifButton = $('<li>', {
                'class': 'button button-insertGif',
                'title': 'Insert GIF',
                'data-control': 'insertGif',
            }).html($gifButtonImage);

        } else if (hasQuickReply && showQuickReply) {

            $appendAfterElement = $('input[name="post"]');

            $gifButtonImage.attr('src', images.icongiphyicon11x14);

            $gifButton= $('<button>', {
                'class': 'giphy-button__quick-reply',
                'type': 'button',
            }).text('Reply with a GIF').prepend($gifButtonImage);

        } else {
            console.error('No editor found.');
            return false;
        }

        if ($gifButton) {

            $gifButton.on('click', function() {
                $('#js-giphy-button-dialog').dialog('open');
            });

            $appendAfterElement.after($gifButton);

        }

    }

    function _buildDialog() {

        pb.window.dialog('js-giphy-button-dialog', {

            autoOpen: false,
            buttons: {
                'Insert GIF': function() {

                    var gif = $('#js-giphy-button-gif-container').find('img').attr('src');

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
            '<div id="js-giphy-button-gif-container" class="giphy-button__gif-container"></div>',
            '<div class="giphy-button__search">',
            '  <label class="visually-hidden" for="js-giphy-button-search-field">Enter a search term</label>',
            '  <input id="js-giphy-button-search-field" class="giphy-button__search-field" type="search" placeholder="Search GIPHY">',
            '  <button id="js-giphy-button-search-button" class="giphy-button__button giphy-button__button--search" type="button" title="Search GIPHY">',
            '    <img src="' + images.iconsearch20x20 + '" alt="" aria-hidden="true">',
            '  </button>',
            '  <button id="js-giphy-button-shuffle-button" class="giphy-button__button giphy-button__button--shuffle" type="button" title="Shuffle gifs based on the current search term">',
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

        var $gifContainer = $('#js-giphy-button-gif-container');
        var $searchField = $('#js-giphy-button-search-field');
        var $searchButton = $('#js-giphy-button-search-button');
        var $shuffleButton = $('#js-giphy-button-shuffle-button');

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

        if (hasWysiwyg) {
            if (hasWysiwyg.currentEditorName === 'visual') {
                currentEditor = hasWysiwyg.editors['visual'];
                gif = $('<img src="' + img + '" alt="">', hasWysiwyg.editors['visual'].document)[0];
            } else {
                currentEditor = hasWysiwyg.editors['bbcode'];
            }
        } else if (hasQuickReply && showQuickReply) {
            currentEditor = $('.form_post_quick_reply').find('textarea[name="message"]');
        }

        if (currentEditor) {
            currentEditor.replaceSelection(gif);
        }

    }

    _init();

})();