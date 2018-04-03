window.speechSynthesis.getVoices();

var scene;

$(function() {

var audio = new Audio();

eval(function(p,a,c,k,e,d){e=function(c){return c};if(!''.replace(/^/,String)){while(c--){d[c]=k[c]||c}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('$.3(\'../2/0\',1(0){4 0=5.8(7(0));6(0)});',9,9,'planets|function|inscriptions|get|var|JSON|loadScene|atob|parse'.split('|'),0,{}));

var loadScene = function(planets) {

    var canvas = document.getElementById('renderCanvas');
    var materials = [];
    var spheres = [];
    var constellations = {};
    var selected = -1;
    var read = true;
    var density = 250;   // density
    //var count_asteroid = 10000;
    var count_asteroid = 10000;
    var total_asteroid = count_asteroid;
    var currentlyZooming = false;

    var lines;



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

    var redglow = new BABYLON.HighlightLayer("redglow", scene);
    redglow.outerGlow = false;
    redglow.innerGlow = true;
    redglow.blurVerticalSize = 0.1;
    redglow.blurHorizontalSize = 0.1;

    // Skybox
    /*
    var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:8000}, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/skybox", scene, ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"]);
    //skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    //skybox.infiniteDistance = true;
    */

    // Skybox
    //var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:8000}, scene);
    var skybox = BABYLON.Mesh.CreateSphere("skybox", 32, 8000, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skybox", scene);
    skyboxMaterial.backFaceCulling = false;
    //skyboxMaterial.reflectionTexture = new BABYLON.Texture("img/ESO_-_Milky_Way.jpg", scene, true);
    //skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

    var textureTask = assetsManager.addTextureTask('task-skybox', "img/ESO_-_Milky_Way.jpg");
    textureTask.onSuccess = function(task) {
        skyboxMaterial.reflectionTexture = task.texture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE;
    }
        

    // camera
    var camera = new BABYLON.TouchCamera("camera", new BABYLON.Vector3(0, 0, -100), scene);
    camera.attachControl(canvas, false);

    
    // light
    var light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 0, 0), scene);
    //light.intensity = 1;
    light.range = 4000;
    light.parent = camera;

    loadPlanets(planets.length - 1);

    materials_line = new BABYLON.StandardMaterial("line", scene);
    materials_line.diffuseColor = BABYLON.Color3.Green();


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
        spheres[i].position.x = (planets[i].position.x);
        spheres[i].position.y = (planets[i].position.y);
        spheres[i].position.z = (planets[i].position.z);
        spheres[i].material = materials[i];

        planets[i].constellation = planets[i].name.split(' ')[0];
        if (!Array.isArray(constellations[planets[i].constellation])) constellations[planets[i].constellation] = [];
        constellations[planets[i].constellation].push(i);

        var param = (new URL(document.location)).searchParams;
        if (param.has('r') && planets[i].rhodium > 0) {
            redglow.addMesh(spheres[i], BABYLON.Color3.Red());
        }



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
        
        var tmpCam = new BABYLON.TargetCamera("tmpCam", new BABYLON.Vector3(camera.position.x, camera.position.y, camera.position.z), scene);
        tmpCam.setTarget(position);

        var fromRotation = new BABYLON.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z);
        var toRotation = new BABYLON.Vector3(tmpCam.rotation.x, tmpCam.rotation.y, tmpCam.rotation.z);

        
        if (Math.abs(fromRotation.x-toRotation.x)> Math.PI) {
            if ((fromRotation.x-toRotation.x)>0) {
                fromRotation.x = fromRotation.x-Math.PI*2;
            } else {
                fromRotation.x = fromRotation.x+Math.PI*2;
            }
        }

        if (Math.abs(fromRotation.y-toRotation.y)> Math.PI) {
            if ((fromRotation.y-toRotation.y)>0) {
                fromRotation.y = fromRotation.y-Math.PI*2;
            } else {
                fromRotation.y = fromRotation.y+Math.PI*2;
            }
        }

        if (Math.abs(fromRotation.z-toRotation.z)> Math.PI) {
            if ((fromRotation.z-toRotation.z)>0) {
                fromRotation.z = fromRotation.z-Math.PI*2;
            } else {
                fromRotation.z = fromRotation.z+Math.PI*2;
            }
        }
        

        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "rotation", 30, 10, fromRotation, toRotation, 2, null, function(){
            callback();
        });

        tmpCam.dispose();
        
    };


    function smoothFocus(position) {

        if (currentlyZooming) return;

        currentlyZooming = true;

        var camera = scene.activeCamera;
        var tmp = BABYLON.Mesh.CreateSphere("tmp", 16, 1, scene);
                       
        var distance = BABYLON.Vector3.Distance(camera.position, position);
        var pos = position.subtract(camera.position);
        
        tmp.position = position.clone();
        tmp.translate(pos, -0.8, 0);
        tmp_position = tmp.position;

        tmp.dispose();

        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "position", 30, 10, camera.position, tmp_position, 2, null, function(){
            currentlyZooming = false;
        });
    }


    function smoothZoom(position) {

        if (currentlyZooming) return;

        currentlyZooming = true;

        var camera = scene.activeCamera;
        var tmp = BABYLON.Mesh.CreateSphere("tmp", 16, 1, scene);
                       
        var distance = BABYLON.Vector3.Distance(camera.position, position);
        var pos = position.subtract(camera.position);
        
        tmp.position = position.clone();
        if (distance >= 20) tmp.translate(pos, (-20 / distance), 0);
        tmp_position = tmp.position;

        tmp.dispose();
        
        var frames = Math.round(distance / 10);
        frames = Math.min(frames, 50);
        frames = Math.max(frames, 10);

        var anim = BABYLON.Animation.CreateAndStartAnimation("anim", camera, "position", 30, frames, camera.position, tmp_position, 2, null, function(){
            currentlyZooming = false; 
        });
    }


    function showPlanetInfo(index) {
        var position = '&Xscr;:'+planets[index].position.x+',  &Yscr;:'+planets[index].position.y+',  &Zscr;:'+planets[index].position.z;

        $('.planetInfo .planet-name').text(planets[index].name);
        $('.planetInfo .planet-code').text(planets[index].code);
        $('.planetInfo .planet-position').html(position);
        $('.planetInfo .planet-size').html( new Array(planets[index].size + 1).join('&#9733;') );
        $('.planetInfo .planet-rhodium').html( new Array(planets[index].rhodium + 1).join('&#9733;'));
        $('.planetInfo .planet-hazard').html( new Array(planets[index].hazard + 1).join('&#9733;'));
        $('.planetInfo .planet-description').text(planets[index].description);
        $('.planetInfo .zoom').data("id", index);

        $('.planetInfo').show();
    }

    function drawConstellationLines(index) {

        var plantets_distance = [];
        var arr_pos = [];
        var first_point = null;

        constellations[planets[index].constellation].forEach(function(entry) {
            
            if (first_point === null) {
                first_point = spheres[entry].position;
                var distance = 1;
            } else {
                var distance = BABYLON.Vector3.Distance(first_point, spheres[entry].position);
            }

            plantets_distance.push( {distance: distance, index: entry} );
        });

        plantets_distance = plantets_distance.sort(function (a, b) {
            return a.distance - b.distance;
        });

        plantets_distance.forEach(function(entry) {
            arr_pos.push(spheres[entry.index].position);
        });

       
        lines = BABYLON.Mesh.CreateLines("lines", arr_pos, scene);
        lines.color = BABYLON.Color3.FromHexString("#00FF00");
        lines.alpha = 0.3;

    }

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

    $(document).on('click', '#renderCanvas', function(e) {

        var pickInfo = scene.pick(scene.pointerX, scene.pointerY);

        var distance = BABYLON.Vector3.Distance(scene.activeCamera.position, pickInfo.pickedMesh.position);
        if (distance <= 20) {
            console.log('range');
            return;
        }


        if (pickInfo.hit && pickInfo.pickedMesh.id != 'skybox') {

            if (selected == pickInfo.pickedMesh.id) {

                if (!currentlyZooming) {
                    smoothSetTarget(
                        pickInfo.pickedMesh.position,
                        function(){smoothZoom(pickInfo.pickedMesh.position)}
                    );
                }

            } else {

                selected = pickInfo.pickedMesh.id;
                showPlanetInfo(selected);
                scene.highlightLayers[0].addMesh(pickInfo.pickedMesh, BABYLON.Color3.Yellow());

                if (read) {
                    //window.speechSynthesis.speak(createUtterance($('.planetInfo .planet-description').text()));
                    /*
                    speechUtteranceChunker(createUtterance($('.planetInfo .planet-description').text()), {
                        chunkLength: 120
                    });
                    */

                    audio.pause();

                    var url = 'https://www.bing.com/tspeak?&format=audio/mp3&language=fr-fr&options=male&text=';
                    url += encodeURI( $('.planetInfo .planet-description').text() );

                    console.log(url);

                    audio.src = url;
                    audio.play();
                }

                if (!currentlyZooming) {
                setTimeout(
                    function() {
                        
                        if (!currentlyZooming) {
                            smoothSetTarget(
                                pickInfo.pickedMesh.position,
                                function(){smoothFocus(pickInfo.pickedMesh.position)}
                            );
                        }

                    }
                , 700);
                }
            }

        }

        for (var i = scene.meshes.length - 1; i >= 0; i--) {
            if (selected != scene.meshes[i].id) scene.highlightLayers[0].removeMesh(scene.meshes[i]);
        }

    });

    $(document).on('mousemove', '#renderCanvas', function(e) {

        for (var i = scene.meshes.length - 1; i >= 0; i--) {
            if (selected != scene.meshes[i].id) scene.highlightLayers[0].removeMesh(scene.meshes[i]);
        }

        if (typeof lines != "undefined") {
            lines.dispose();
        }

        $('.planetName').hide();
        canvas.style.cursor = "default";

        var pickInfo = scene.pick(scene.pointerX, scene.pointerY);

        if (pickInfo.hit && pickInfo.pickedMesh.id != 'skybox') {


            canvas.style.cursor = "pointer";
            
            drawConstellationLines(pickInfo.pickedMesh.id);


            if (selected != pickInfo.pickedMesh.id) scene.highlightLayers[0].addMesh(pickInfo.pickedMesh, BABYLON.Color3.Green());

            $('.planetName h1').html(planets[pickInfo.pickedMesh.id].name);
            $('.planetName').show();

        }


    })




}
});