document.addEventListener('DOMContentLoaded', function () {
    // View All button -> Payments page
    const viewAll = document.querySelector('.view-button');
    if (viewAll) {
        viewAll.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    }

    // Make recent payments rows clickable -> Payments page
    document.querySelectorAll('.panel table tbody tr').forEach(function (tr) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function () {
            window.location.href = 'payments.html';
        });
    });

    // Make due items clickable -> Rent Collection page
    document.querySelectorAll('.due-item').forEach(function (item) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function () {
            window.location.href = 'rent-collection.html';
        });
    });

});
