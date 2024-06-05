document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    const selectElement = document.getElementById('options1');
    const lightImage1 = document.getElementById('light1');
    let blinkInterval;

    selectElement.addEventListener('change', function () {
        clearInterval(blinkInterval);
        const selectedOption = selectElement.value;
        console.log('Selected Option:', selectedOption);

        switch (selectedOption) {
            case 'Off':
                console.log('Turning off the light');
                lightImage1.style.display = 'none';
                break;
            case 'Solid':
                console.log('Setting light to solid');
                lightImage1.style.display = 'block';
                break;
            case 'Blink2s':
                console.log('Setting light to blink every 2 seconds');
                blinkImage(2000);
                break;
            case 'Blink5s':
                console.log('Setting light to blink every 5 seconds');
                blinkImage(5000);
                break;
            case 'Blink10s':
                console.log('Setting light to blink every 10 seconds');
                blinkImage(10000);
                break;
        }
    });

    function blinkImage(interval) {
        lightImage1.style.display = 'block';
        let visible = true;
        blinkInterval = setInterval(function () {
            lightImage1.style.display = visible ? 'none' : 'block';
            visible = !visible;
        }, interval);
    }
});
