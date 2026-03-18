jQuery(document).ready(function($){
    var dragging = false,
    scrolling = false,
    resizing = false;
    //cache jQuery objects
    var imageComparisonContainers = $('.cd-image-container');
    //check if the .cd-image-container is in the viewport 
    //if yes, animate it
    checkPosition(imageComparisonContainers);
    $(window).on('scroll', function(){
        if( !scrolling) {
            scrolling =  true;
            ( !window.requestAnimationFrame )
            ? setTimeout(function(){checkPosition(imageComparisonContainers);}, 100)
            : requestAnimationFrame(function(){checkPosition(imageComparisonContainers);});
        }
    });
    
    //make the .cd-handle element draggable and modify .cd-resize-img width according to its position
    imageComparisonContainers.each(function(){
        var actual = $(this);
        drags(actual.find('.cd-handle'), actual.find('.cd-resize-img'), actual, actual.find('.cd-image-label[data-type="original"]'), actual.find('.cd-image-label[data-type="modified"]'));
    });
    
    //upadate images label visibility
    $(window).on('resize', function(){
        if( !resizing) {
            resizing =  true;
            ( !window.requestAnimationFrame )
            ? setTimeout(function(){checkLabel(imageComparisonContainers);}, 100)
            : requestAnimationFrame(function(){checkLabel(imageComparisonContainers);});
        }
    });
    
    function checkPosition(container) {
        container.each(function(){
            var actualContainer = $(this);
            if( $(window).scrollTop() + $(window).height()*0.5 > actualContainer.offset().top) {
                actualContainer.addClass('is-visible');
            }
        });
        
        scrolling = false;
    }
    
    function checkLabel(container) {
        container.each(function(){
            var actual = $(this);
            updateLabel(actual.find('.cd-image-label[data-type="modified"]'), actual.find('.cd-resize-img'), 'left');
            updateLabel(actual.find('.cd-image-label[data-type="original"]'), actual.find('.cd-resize-img'), 'right');
        });
        
        resizing = false;
    }
    
    //draggable funtionality - credits to http://css-tricks.com/snippets/jquery/draggable-without-jquery-ui/
    function drags(dragElement, resizeElement, container, labelContainer, labelResizeElement) {
        dragElement.on("mousedown vmousedown", function(e) {
            dragElement.addClass('draggable');
            resizeElement.addClass('resizable');
            
            var dragWidth = dragElement.outerWidth(),
            xPosition = dragElement.offset().left + dragWidth - e.pageX,
            containerOffset = container.offset().left,
            containerWidth = container.outerWidth(),
            minLeft = containerOffset + 10,
            maxLeft = containerOffset + containerWidth - dragWidth - 10;
            
            $(document).on("mousemove vmousemove", function(e) {
                if( !dragging) {
                    dragging =  true;
                    ( !window.requestAnimationFrame )
                    ? setTimeout(function(){animateDraggedHandle(e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement);}, 100)
                    : requestAnimationFrame(function(){animateDraggedHandle(e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement);});
                }
            }).on("mouseup vmouseup", function(e){
                $('.draggable').removeClass('draggable');
                $('.resizable').removeClass('resizable');
                $(document).off("mousemove vmousemove");
                $(document).off("mouseup vmouseup");
                dragging = false;
            });
            e.preventDefault();
        }).on("mouseup vmouseup", function(e) {
            $('.draggable').removeClass('draggable');
            $('.resizable').removeClass('resizable');
        });
    }
    
    
    function animateDraggedHandle(e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement) {
        var leftValue = e.pageX + xPosition - dragWidth;   
        //constrain the draggable element to move inside his container
        if(leftValue < minLeft ) {
            leftValue = minLeft;
        } else if ( leftValue > maxLeft) {
            leftValue = maxLeft;
        }
        
        var widthValue = (leftValue + dragWidth/2 - containerOffset)*100/containerWidth+'%';
        
        //rotateCard((leftValue + dragWidth/2 - containerOffset)*100/containerWidth)
        
        
        $('.draggable').css('left', widthValue).on("mouseup vmouseup", function() {
            $(this).removeClass('draggable');
            resizeElement.removeClass('resizable');
        });
        
        $('.resizable').css('width', widthValue); 
        
        updateLabel(labelResizeElement, resizeElement, 'left');
        updateLabel(labelContainer, resizeElement, 'right');
        dragging =  false;
    }
    
    function updateLabel(label, resizeElement, position) {
        if(position == 'left') {
            ( label.offset().left + label.outerWidth() < resizeElement.offset().left + resizeElement.outerWidth() ) ? label.removeClass('is-hidden') : label.addClass('is-hidden') ;
        } else {
            ( label.offset().left > resizeElement.offset().left + resizeElement.outerWidth() ) ? label.removeClass('is-hidden') : label.addClass('is-hidden') ;
        }
    }
});


const card = document.querySelector(".card");
function rotateCard(rotateX) {
    console.log(rotateX);
    //format rotateX
    rotateX = (rotateX - 50) /4;
    card.style.transform = `perspective(1000px) rotateY(${rotateX}deg) rotateX(0deg) scale3d(1, 1, 1)`;
}


function getLoginState()
{
    try
    {
        //Does _vg_logged_in equal true
        if (document.cookie.indexOf('_vg_logged_in') >= 0)
        {
            document.getElementById('loginRegisterFront').style.animation = 'fade-out-in 1.0s ease-in-out';
            setTimeout(function(){
                document.getElementById('loginRegisterFront').innerHTML = '<a style="margin-left:152px" href="/p/panel" class="inline-flex tracking-wide uppercase text-xs items-center sm:mt-0 mt-5 sm:ml-8 justify-center px-5 py-2.5 font-semibold text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">Panel</a>'
            }, 400);
        }
    }
    catch (e)
    {
        console.log(e);
    }
}


getLoginState();