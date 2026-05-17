let productData = null;

$(document).ready(function() {
    $.getJSON('application/model/data.json', function(data) {
        productData = data.products;

        // Populate gallery row with all product thumbnails
        let galleryHtml = '';
        productData.forEach(p => {
            galleryHtml += `
                <div class="col-md-2 col-4 mb-3">
                    <img src="${p.thumbnail}" class="img-fluid gallery-thumb"
                         onclick="loadProduct(${p.id})" alt="${p.title}">
                </div>`;
        });
        $('#gallery-row').html(galleryHtml);
    }).fail(function() {
        console.error('Failed to load product data');
    });
});

// Called from main.js after a model loads
window.populateProductInfo = function(id) {
    if (!productData) return;
    const p = productData.find(x => x.id === id);
    if (!p) return;
    $('#product-title').text(p.title);
    $('#product-description').text(p.description);
};