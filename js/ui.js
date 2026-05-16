function showSection(sectionName) {
    $('.content-section').hide();
    $('#' + sectionName + '-section').fadeIn(300);

    if (sectionName === 'about' && !window.aboutLoaded) {
        loadAboutPage();
        window.aboutLoaded = true;
    }
}
window.showSection = showSection;

const originalLoadProduct = window.loadProduct;
window.loadProduct = function(id) {
    showSection('products');
    if (originalLoadProduct) originalLoadProduct(id);
};


function loadAboutPage() {
    $.get('application/view/viewAbout.php', function(data) {
        $('#about-content').html(data);
    }).fail(function() {
        $('#about-content').html('<p class="text-muted">About content unavailable offline. Run via local server.</p>');
    });
}