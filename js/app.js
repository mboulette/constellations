var scene;
var synthesis;

var loadVoice = function() {

    console.log('voice');

    var $voices = window.speechSynthesis.getVoices();
    synthesis = new SpeechSynthesisUtterance();

    for(i = 0; i < $voices.length ; i++) {
        if ($voices[i].lang == 'fr-CA') {
            synthesis.voice = $voices[i];
        }
    }

    synthesis.rate = 1;
    synthesis.pitch = 0.6;
};


$(function() {

    var canvas = document.getElementById('renderCanvas');
    var materials = [];
    var spheres = [];
    var selected = '';
    var read = true;

    loadVoice();


    var engine = new BABYLON.Engine(canvas, true,  { stencil: true });

    // scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    scene.collisionsEnabled = true;

    var highlight = new BABYLON.HighlightLayer("highlight", scene);
    highlight.outerGlow = true;
    highlight.innerGlow = true;

    // Skybox
    var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:8000}, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    skybox.checkCollisions = true;
    //skybox.infiniteDistance = true;




    // camera
    var camera = new BABYLON.TouchCamera("camera", new BABYLON.Vector3(0, 0, -100), scene);
    camera.attachControl(canvas, false);

    
    // light
    var light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 0, 0), scene);
    //light.intensity = 1;
    light.range = 10000;
    light.parent = camera;


    for (var i = planets.length - 1; i >= 0; i--) {

        var position = 'X'+planets[i].position.x+' Y'+planets[i].position.y+' Z'+planets[i].position.z;
        
        //Info
        $planetInfo = $('.planetInfo.template').clone();

        $planetInfo.find('.planet-name').text(planets[i].name);
        $planetInfo.find('.planet-code').text(planets[i].code);
        $planetInfo.find('.planet-position').text(position);
        $planetInfo.find('.planet-size').html( new Array(planets[i].size + 1).join('&#9733;') );
        $planetInfo.find('.planet-rhodium').html( new Array(planets[i].rhodium + 1).join('&#9733;'));
        $planetInfo.find('.planet-hazard').html( new Array(planets[i].hazard + 1).join('&#9733;'));
        $planetInfo.find('.planet-description').text(planets[i].description);
        $planetInfo.find('.zoom').data("id", planets[i].code);
        $planetInfo.attr('id', planets[i].code);
        $planetInfo.removeClass('template');

        $planetInfo.appendTo('#placeholder');

        
        //Mouse Over
        $planetName = $('.planetName.template').clone();
        
        $planetName.attr('id', 'name_'+planets[i].code);
        $planetName.find('h1').text(planets[i].name);
        $planetName.removeClass('template');

        $planetName.appendTo('.planetCenter');


        //Materials
        materials[i] = new BABYLON.StandardMaterial("texture-"+i, scene);
        materials[i].diffuseTexture = new BABYLON.Texture(planets[i].texture, scene);
        materials[i].bumpTexture = new BABYLON.Texture("img/bump.jpg", scene);
        materials[i].emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        materials[i].specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        //Spheres
        spheres[i] = BABYLON.Mesh.CreateSphere(planets[i].code, 16, (planets[i].size * 2), scene);
        spheres[i].actionManager = new BABYLON.ActionManager(scene);
        spheres[i].checkCollisions = true;
        spheres[i].position.x = (planets[i].position.x * 50);
        spheres[i].position.y = (planets[i].position.y * 50);
        spheres[i].position.z = (planets[i].position.z * 50);
        spheres[i].material = materials[i];

    };


    function smoothSetTarget(position, callback) {
        var camera = scene.activeCamera;
        var start = new BABYLON.Vector3(camera.getTarget().x, camera.getTarget().y, camera.getTarget().z);
        
        camera.setTarget(position);
        var goal = new BABYLON.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z);
        camera.setTarget(start);


        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "rotation", 30, 10, camera.rotation, goal, 2, null, function(){
            callback();
        });
        
    };


    function smoothFocus(position) {

        var camera = scene.activeCamera;
        var tmp = BABYLON.Mesh.CreateSphere("tmp", 16, 1, scene);
                       
        var distance = BABYLON.Vector3.Distance(camera.position, position);
        var pos = position.subtract(camera.position);
        
        tmp.position = position.clone();
        tmp.translate(pos, -0.8, 0);
        tmp_position = tmp.position;

        tmp.dispose();

        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "position", 30, 10, camera.position, tmp_position, 2);
    }


    function smoothZoom(position) {

        var camera = scene.activeCamera;
        var tmp = BABYLON.Mesh.CreateSphere("tmp", 16, 1, scene);
                       
        var distance = BABYLON.Vector3.Distance(camera.position, position);
        var pos = position.subtract(camera.position);
        
        tmp.position = position.clone();
        tmp.translate(pos, (-20 / distance), 0);
        tmp_position = tmp.position;

        tmp.dispose();
        
        var frames = Math.round(distance / 10);
        frames = Math.min(frames, 50);
        frames = Math.max(frames, 10);

        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "position", 30, frames, camera.position, tmp_position, 2);
    }




    scene.onPointerObservable.add(function (eventData, eventState) {
        
        $('.planetName').hide();

        for (var i = scene.meshes.length - 1; i >= 0; i--) {
            if (selected != scene.meshes[i].id) scene.highlightLayers[0].removeMesh(scene.meshes[i]);
        }

        if (eventData.pickInfo.hit && eventData.pickInfo.pickedMesh.id != 'skybox') {

            if (eventData.type == 1) {
                $('.planetInfo').hide();
                window.speechSynthesis.cancel();

                if (selected == eventData.pickInfo.pickedMesh.id) {
                    selected = '';
                } else {
                    selected = eventData.pickInfo.pickedMesh.id;
                    $('#'+selected).show();

                    synthesis.text = $('#'+selected+' .planet-description').text();
                    if (read) window.speechSynthesis.speak(synthesis);

                    smoothSetTarget(
                        eventData.pickInfo.pickedMesh.position,
                        function(){smoothFocus(eventData.pickInfo.pickedMesh.position)}
                    );

                }

            }

            if (selected == eventData.pickInfo.pickedMesh.id) {
                scene.highlightLayers[0].addMesh(eventData.pickInfo.pickedMesh, BABYLON.Color3.Yellow());
            } else {
                scene.highlightLayers[0].addMesh(eventData.pickInfo.pickedMesh, BABYLON.Color3.Green());
            }

            $('#name_'+eventData.pickInfo.pickedMesh.id).show();

        }

    });


    engine.runRenderLoop(function(){

        if (camera.position.x > 1800) camera.position.x = 1800;
        if (camera.position.y > 1800) camera.position.y = 1800;
        if (camera.position.z > 1800) camera.position.z = 1800;

        if (camera.position.x < -1800) camera.position.x = -1800;
        if (camera.position.y < -1800) camera.position.y = -1800;
        if (camera.position.z < -1800) camera.position.z = -1800;

        if (selected != '') {
            var cur_mesh = scene.getNodeByID(selected);
            var distance = BABYLON.Vector3.Distance(scene.activeCamera.position, cur_mesh.position);

            $('.planetInfo:visible:first .planet-distance').text(Math.round(distance));
        }

        scene.render();       
    });
        

    window.addEventListener('resize', function(){
        engine.resize();
    });


    $(document).on('click', '.close', function(event){
       
        $('.planetInfo').hide();
        for (var i = scene.meshes.length - 1; i >= 0; i--) {
            scene.highlightLayers[0].removeMesh(scene.meshes[i]);
        }

        selected = '';
        window.speechSynthesis.cancel();

        $('#renderCanvas').focus();
        
    });

    $(document).on('click', '.zoom', function(event){                  
        var cur_mesh = scene.getNodeByID($(this).data('id'));
        smoothSetTarget(cur_mesh.position, function(){smoothZoom(cur_mesh.position)} );
        $('#renderCanvas').focus();
    });

    $(document).on('click', '.goto-center', function(event){                  
        var position = new BABYLON.Vector3($('#input-x').val()*50, $('#input-y').val()*50, $('#input-z').val()*50);
        smoothSetTarget(position, function(){smoothZoom(position)} );
        $('#renderCanvas').focus();
    });

    $(document).on('click', '.stop-play', function(event){                  
        read = !read;
        window.speechSynthesis.cancel();

        $(this).find('img').attr('src', 'img/ico-sound-off.png');
        if (read) $(this).find('img').attr('src', 'img/ico-sound-on.png');
    });


    $(document).on('DOMMouseScroll', function(e) {
        var camera = scene.activeCamera;

        var length = e.detail;
        var DirX = Math.sin(camera.rotation.y) * Math.cos(camera.rotation.x);
        var DirY = -Math.sin(camera.rotation.x);
        var DirZ = Math.cos(camera.rotation.y) * Math.cos(camera.rotation.x);
        camera.cameraDirection = camera.cameraDirection.add(new BABYLON.Vector3(length * DirX, length * DirY, length * DirZ));

    });


    $(document).on('mousewheel', function(e) {

        var camera = scene.activeCamera;

        var length = e.originalEvent.wheelDelta / 200;
        var DirX = Math.sin(camera.rotation.y) * Math.cos(camera.rotation.x);
        var DirY = -Math.sin(camera.rotation.x);
        var DirZ = Math.cos(camera.rotation.y) * Math.cos(camera.rotation.x);
        camera.cameraDirection = camera.cameraDirection.add(new BABYLON.Vector3(length * DirX, length * DirY, length * DirZ));

    });



});
