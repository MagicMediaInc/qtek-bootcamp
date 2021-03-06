define(function(require) {

    var qtek = require('qtek');
    var World = require('framework/World');
    var Atmosphere = require('framework/Atmosphere');
    var app3D = require('../app');

    var menuEntity = require('../entities/menu');

    var menuItems = [
        {
            title : 'continue',
            onenter : function() {
                bootcamp._hideMenu();
            }
        },
        // {
        //     title : 'options'
        // },
        {
            title : 'exit',
            onenter : function() {
                app3D.unloadWorld(bootcamp);
                app3D.start();
                setTimeout(function() {
                    app3D.loadWorld(bootcamp.prevWorld);
                }, 1000);
            }
        }
    ];

    var bootcamp = World.create({

        entities : [
            require('../entities/fireParticle'),
            require('../entities/m4'),
            require('../entities/propBattleBus'),
            require('../entities/scene'),
            require('../entities/soldier')
        ],

        graphicConfig : {
            enableShadow : true,
            shadowConfig : {
                shadowCascade : 4,
                cascadeSplitLogFactor : 0.8
            },
            enablePostProcessing : true
        },

        prevWorld : null,

        _sunLight : null,
        _atmospherePass : null,

        _sunsetLight : new qtek.math.Vector3(0.71, 0.49, 0.36),
        _noonLight : new qtek.math.Vector3(0.75, 0.75, 0.68),

        _isInMenu : false,

        _isInitialized : false,

        onload : function() {

            this._initLight();

            this._initSkybox();

            this._initGround();
        },

        onprogress : function(percent, nSettled, nAll) {
            app3D.setLoadingDesc('LOADING SCENE');
            app3D.showLoading();
            app3D.setLoadingPercent(percent * 0.5);
        },
        
        ontextureprogress : function(percent, nSettled, nAll) {
            app3D.setLoadingDesc('LOADING TEXTURES');
            app3D.setLoadingPercent(percent * 0.5 + 0.5);
        },

        ontextureload : function() {
            app3D.hideLoading();
            this._isInitialized = true;
        },

        _initGround : function() {
            // Floor
            var floorBody = new qtek.physics.RigidBody({
                shape : new qtek.physics.shape.StaticPlane()
            });
            var floorNode = new qtek.Node();
            floorNode.rotation.rotateX(-Math.PI / 2);
            app3D.physicsEngine.addCollider(new qtek.physics.Collider({
                collisionObject : floorBody,
                physicsMaterial : new qtek.physics.Material(),
                sceneNode : floorNode,
                isStatic : true
            }));
        },

        _initLight : function() {

            var light = new qtek.light.Directional({
                intensity : 2.6,
                shadowResolution : 1024,
                shadowBias : 0.004,
                shadowSlopeScale : 4
            });
            light.position.set(3, 3, 10);
            light.lookAt(qtek.math.Vector3.ZERO);

            var cos = light.position.clone().normalize().dot(qtek.math.Vector3.UP);
            light.color = new qtek.math.Vector3().lerp(this._sunsetLight, this._noonLight, cos)._array;

            this.scene.add(light);

            this.scene.add(new qtek.light.Ambient({
                intensity : 0.4
            }));

            this._sunLight = light;
        },

        _initSkybox : function() {
            var cubeMap = new qtek.texture.TextureCube({
                width : 512,
                height : 512,
                type : qtek.Texture.FLOAT
            });
            var atmospherePass = new Atmosphere({
                texture : cubeMap
            });

            this._sunLight.update();
            atmospherePass.light = this._sunLight;
            atmospherePass.render(app3D.renderer);

            var skybox = new qtek.plugin.Skybox({
                scene : this.scene
            });
            skybox.material.set('environmentMap', cubeMap);

            this._atmospherePass = atmospherePass;
        },

        _showMenu : function() {
            app3D.pause();
            menuEntity.menuItems = menuItems;
            menuEntity.$loadSelf();
            app3D.addEntity(menuEntity);
            this._isInMenu = true;
        },

        _hideMenu : function() {
            app3D.start();
            menuEntity.$unloadSelf();
            app3D.removeEntity(menuEntity);
            this._isInMenu = false;
        },

        // esc will not trigger the onkeydown event when pointer lock 
        onkeyup : function(e) {
            if (!this._isInitialized) {
                return;
            }
            switch(e.keyCode) {
                case 27: //esc
                    // if (!this._isInMenu) {
                    //     this._showMenu();
                    // } else {
                    //     this._hideMenu();
                    // }
                    break;
            }
        }
    });

    return bootcamp;
});