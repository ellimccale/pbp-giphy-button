/*!
 * Plugin Name: GIPHY Button
 * Plugin URI:  http://ellitest.proboards.com
 * Author:      Elli
 * Author URI:  http://ellimccale.com/
 * Version:     0.1.0
 */

(function() {

    var PLUGIN_ID = 'giphy_button';
    var GIPHY_API = 'https://api.giphy.com/v1/gifs/search';

    var settings = {};
    var images = {};

    var wysiwyg = null;
    var quickReply = pb.data('quick_reply');
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

        showQuickReply = (settings.show_quick_reply === 'true');

        if (quickReply && showQuickReply) {
            _buildQuickReplyButton();
            _buildDialog();
            _handleSearch();
        } else {
            $(document).on('wysiwygcreate', function(e) {

                wysiwyg = $(e.target).data('wysiwyg');

                _buildEditorButton();
                _buildDialog();
                _handleSearch();

            });
        }

    }

    function _buildEditorButton() {

        var $editorControls = $('.controls .visual-editor, .controls .bbcode-editor');
        var $editorImageButton = $editorControls.find('[data-control="insertImage"]');

        var $giphyButtonImage = $('<img>', {
            'src': '',
            'alt': '',
        });

        var selectedImage = settings.button_image;

        if (settings.button_custom_image.length) {
            $giphyButtonImage.attr('src', settings.button_custom_image);
        } else if (selectedImage === 'button_cool') {
            $giphyButtonImage.attr('src', images.buttongiphycool26x22);
        } else if (selectedImage === 'button_warm') {
            $giphyButtonImage.attr('src', images.buttongiphywarm26x22);
        } else if (selectedImage === 'button_black') {
            $giphyButtonImage.attr('src', images.buttongiphyicon26x22);
        } else {
            $giphyButtonImage.attr('src', images.buttongiphypb26x22);
        }

        var $giphyButton = $('<li>', {
            'class': 'button button-insertGif',
            'title': 'Insert GIF',
            'data-control': 'insertGif',
        }).html($giphyButtonImage);

        _handleClickEvent($giphyButton);

        $editorImageButton.after($giphyButton);

    }

    function _buildQuickReplyButton() {

        var $replyButton = $('input[name="post"]');

        var $giphyButton= $('<button>', {
            'class': 'ui-button',
            'type': 'button',
        }).text('Reply with a GIF');

        _handleClickEvent($giphyButton);

        $replyButton.after($giphyButton);

    }

    function _handleClickEvent(button) {
        button.on('click', function() {
            $('#js-giphy-button-dialog').dialog('open');
        });
    }

    function _buildDialog() {
        
        var $giphyAttr = $('<p>Powered by GIPHY</p>').css({
            'display': 'inline-block',
            'opacity': '0.75',
            'padding-right': '20px',
            'vertical-align': 'middle',
        });

        pb.window.dialog('js-giphy-button-dialog', {

            autoOpen: false,
            buttons: {
                'Insert GIF': function() {

                    var imgSrc = $('#js-giphy-button-gif-container').find('img').attr('src');

                    if (imgSrc) {
                        _insertGif(imgSrc);
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

            open: function(e, ui) {

                $(this).css({
                    '-webkit-box-sizing': 'border-box',
                    'box-sizing': 'border-box',
                    'height': '268px',
                    'padding': '10px',
                });
        
                var $buttonPane = $(this).siblings('.ui-dialog-buttonpane').find('.ui-dialog-buttonset');
        
                if (!$buttonPane.find($giphyAttr).length) {
                    $buttonPane.prepend($giphyAttr);
                }

            },

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
            api_key: settings.api_key || 'Mpj7IqNxtW6QbpDx61TAjA9pe88I1z3d',
            q: searchTerm,
            limit: 20,
        }).done(function(response) {

            var meta = response.meta;
            var data = response.data;

            if (meta.status === 200) {

                var gifArr = [];

                $.each(data, function(index, giphy) {

                    var $eachImage = $('<img>', {
                        'alt': '',
                        'src': giphy.images.fixed_height.url,
                    });

                    gifArr.push($eachImage);

                });

                storeGifs(gifArr);

            }

        }).fail(function(jqxhr, textStatus, error) {
            console.error('Unable to call the GIPHY API: ' + error + ', ' + textStatus);
        });

    }

    function _insertGif(url) {

        var currentEditor = null;
        var gif = '[img src="' + url + '" alt=""]';

        if (wysiwyg) {
            if (wysiwyg.currentEditorName === 'visual') {
                currentEditor = wysiwyg.editors['visual'];
                gif = $('<img src="' + url + '" alt="">', wysiwyg.editors['visual'].document)[0];
            } else {
                currentEditor = wysiwyg.editors['bbcode'];
            }
        } else if (quickReply && showQuickReply) {
            currentEditor = $('.form_post_quick_reply').find('textarea[name="message"]');
        }

        if (currentEditor) {
            currentEditor.replaceSelection(gif);
        }

    }

    _init();

})();