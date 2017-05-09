window.speechSynthesis.getVoices();

var scene;

var createUtterance = function(text) {
    var $voices = window.speechSynthesis.getVoices();
    utterance = new SpeechSynthesisUtterance();
   
    for(i = 0; i < $voices.length ; i++) {
        if ($voices[i].name == 'Thomas') {
            utterance.voice = $voices[i];
        }
    }
   
    utterance.rate = 1;
    utterance.text = text;
    return utterance;
}


$(function() {
$.getJSON('../inscriptions/planets', function(planets) {

    var canvas = document.getElementById('renderCanvas');
    var materials = [];
    var spheres = [];
    var selected = -1;
    var read = true;
    var density = 250;   // density
    var count_asteroid = 10000;
    var total_asteroid = count_asteroid;



    var engine = new BABYLON.Engine(canvas, true,  { stencil: true });
    engine.loadingUIText = "Chargement des rapports de sondes...";
    engine.displayLoadingUI();

    // scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    scene.collisionsEnabled = true;

    var assetsManager = new BABYLON.AssetsManager(scene);

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
    //skybox.infiniteDistance = true;

    // camera
    var camera = new BABYLON.TouchCamera("camera", new BABYLON.Vector3(0, 0, -100), scene);
    camera.attachControl(canvas, false);

    
    // light
    var light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 0, 0), scene);
    //light.intensity = 1;
    light.range = 4000;
    light.parent = camera;

    loadPlanets(planets.length - 1);


    function loadPlanets(i) {

        engine.loadingUIText = "Chargement des planètes " + (planets.length - i) + " / " + planets.length + "...";
      
        //Materials
        materials[i] = new BABYLON.StandardMaterial("texture-"+i, scene);
        materials[i].emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        materials[i].specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        var textureTask = assetsManager.addTextureTask('task-'+i, (planets[i].texture == '') ? "img/rock.jpg" : planets[i].texture );
        textureTask.onSuccess = function(task) {
            materials[task.name.split('-')[1]].diffuseTexture = task.texture;
        }

        var bumpTask = assetsManager.addTextureTask('bump-'+i, (planets[i].bump == '') ? "img/bump.jpg" : planets[i].bump );
        bumpTask.onSuccess = function(task) {
            materials[task.name.split('-')[1]].bumpTexture = task.texture;
        }

        if (planets[i].color.toUpperCase() != '#FFFFFF') {
            materials[i].diffuseColor = new BABYLON.Color3.FromHexString(planets[i].color.toUpperCase());
        }
                  
        //Spheres
        spheres[i] = BABYLON.Mesh.CreateSphere(i, 16, (planets[i].size * 3), scene);
        spheres[i].actionManager = new BABYLON.ActionManager(scene);
        spheres[i].position.x = (planets[i].position.x);
        spheres[i].position.y = (planets[i].position.y);
        spheres[i].position.z = (planets[i].position.z);
        spheres[i].material = materials[i];

        i--;
        if (i >= 0) {
            setTimeout(function(){
                loadPlanets(i);
            });
        } else {
            setTimeout(function(){
                loadAsteroid()
            });
        }

    }

    

    function loadAsteroid() {

        engine.loadingUIText = "Chargement de la ceinture d'astéroïdes "+(total_asteroid - count_asteroid + 1) + " / " + total_asteroid + "...";
        count_asteroid -= density;

        //Materials
        material_asteroid = new BABYLON.StandardMaterial("texture-asteroid", scene);
        material_asteroid.diffuseTexture = new BABYLON.Texture('img/rock.jpg', scene);
        material_asteroid.bumpTexture = new BABYLON.Texture('img/bump.jpg', scene);
        material_asteroid.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material_asteroid.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        material_asteroid.backFaceCulling = false;

        var SolidParticleSystem = new BABYLON.SolidParticleSystem('SolidParticleSystem', scene, {updatable: false});
        var sphere = BABYLON.MeshBuilder.CreateSphere("s", {diameter: 1, segments: 8}, scene);

        SolidParticleSystem.addShape(sphere, density, {positionFunction: myPositionFunction, vertexFunction: myVertexFunction});
        sphere.dispose();   // dispose the model

        var asteroid = SolidParticleSystem.buildMesh();
        asteroid.material = material_asteroid;
        asteroid.rotation.z = -0.08 * Math.PI;
        asteroid.position.x = -800;
        asteroid.position.y = 1300;
        asteroid.position.z = -800;

        if (count_asteroid > 0) {
            setTimeout(function(){
                loadAsteroid();
            });
        } else {
            setTimeout(function(){
                engine.loadingUIText = "Chargement des textures..."
                assetsManager.load();
            });
        }

    }

    function myVertexFunction(particle, vertex, i) {
        vertex.x *= (Math.random() + 1);
        vertex.y *= (Math.random() + 1);
        vertex.z *= (Math.random() + 1);
    };

    function myPositionFunction(particle, i, s) {
        scale = Math.random() + Math.random() + Math.random();
        particle.scale.x = (scale + (Math.random() * 3)) * 0.8;
        particle.scale.y = (scale + (Math.random() * 3)) * 0.8;
        particle.scale.z = (scale + (Math.random() * 3)) * 0.8;

        nb = density;
        radius = 2000;
        variation = 300;
        var angle = (s / nb) * Math.PI * 2;

        particle.position.x = (Math.cos(angle)*radius) + (Math.random()*variation) - (variation/2);
        particle.position.z = (Math.sin(angle)*radius) + (Math.random()*variation) - (variation/2);
        particle.position.y = (Math.random()*variation/3) + (Math.random()*variation/3) + (Math.random()*variation/3) - (variation/2);

        particle.rotation.x = Math.random() * Math.PI;
        particle.rotation.y = Math.random() * Math.PI;
        particle.rotation.z = Math.random() * Math.PI;
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

        canvas.style.cursor = "default";

        if (eventData.pickInfo.hit && eventData.pickInfo.pickedMesh.id != 'skybox') {

            canvas.style.cursor = "pointer";

            if (eventData.type == 1) {
                $('.planetInfo').hide();
                window.speechSynthesis.cancel();

                if (selected == eventData.pickInfo.pickedMesh.id) {
                    selected = -1;
                } else {
                    selected = eventData.pickInfo.pickedMesh.id;

                    var position = '&Xscr;:'+planets[selected].position.x+',  &Yscr;:'+planets[selected].position.y+',  &Zscr;:'+planets[selected].position.z;

                    $('.planetInfo .planet-name').text(planets[selected].name);
                    $('.planetInfo .planet-code').text(planets[selected].code);
                    $('.planetInfo .planet-position').html(position);
                    $('.planetInfo .planet-size').html( new Array(planets[selected].size + 1).join('&#9733;') );
                    $('.planetInfo .planet-rhodium').html( new Array(planets[selected].rhodium + 1).join('&#9733;'));
                    $('.planetInfo .planet-hazard').html( new Array(planets[selected].hazard + 1).join('&#9733;'));
                    $('.planetInfo .planet-description').text(planets[selected].description);
                    $('.planetInfo .zoom').data("id", selected);

                    $('.planetInfo').show();

                    if (read) window.speechSynthesis.speak(createUtterance($('.planetInfo .planet-description').text()));

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

            $('.planetName h1').html(planets[eventData.pickInfo.pickedMesh.id].name);
            $('.planetName').show();

        }

    });


    assetsManager.onFinish = function (tasks) {

        engine.runRenderLoop(function(){

            if (camera.position.x > 1800) camera.position.x = 1800;
            if (camera.position.y > 1800) camera.position.y = 1800;
            if (camera.position.z > 1800) camera.position.z = 1800;

            if (camera.position.x < -1800) camera.position.x = -1800;
            if (camera.position.y < -1800) camera.position.y = -1800;
            if (camera.position.z < -1800) camera.position.z = -1800;

            if (selected != -1) {
                var cur_mesh = scene.getNodeByID(selected);
                var distance = BABYLON.Vector3.Distance(scene.activeCamera.position, cur_mesh.position);

                $('.planetInfo:visible:first .planet-distance').text(Math.round(distance));
            }

            
            scene.render();
        });

    };

    assetsManager.onTaskSuccess = function (tasks) {
        engine.loadingUIText = "Chargement des textures " + (assetsManager.tasks.length - assetsManager.waitingTasksCount) + " / " + assetsManager.tasks.length + "...";

    };
    
    assetsManager.onTaskError = function (tasks) {
        console.log('onTaskError');
        console.log(tasks);

    }; 

    window.addEventListener('resize', function(){
        engine.resize();
    });


    $(document).on('click', '.close', function(event){
       
        $('.planetInfo').hide();
        for (var i = scene.meshes.length - 1; i >= 0; i--) {
            scene.highlightLayers[0].removeMesh(scene.meshes[i]);
        }

        selected = -1;
        window.speechSynthesis.cancel();

        $('#renderCanvas').focus();
        
    });

    $(document).on('click', '.zoom', function(event){                  
        var cur_mesh = scene.getNodeByID($(this).data('id'));
        smoothSetTarget(cur_mesh.position, function(){smoothZoom(cur_mesh.position)} );
        $('#renderCanvas').focus();
    });

    $(document).on('click', '.goto-center', function(event){                  
        var position = new BABYLON.Vector3($('#input-x').val(), $('#input-y').val(), $('#input-z').val());
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
});