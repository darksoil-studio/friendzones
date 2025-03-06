{ inputs, ... }:

{
  # Import all ./zomes/coordinator/*/zome.nix and ./zomes/integrity/*/zome.nix  
  imports = (
      map (m: "${./.}/zomes/coordinator/${m}/zome.nix")
        (builtins.attrNames (builtins.readDir ./zomes/coordinator))
    )
    ++ 
    (
      map (m: "${./.}/zomes/integrity/${m}/zome.nix")
        (builtins.attrNames (builtins.readDir ./zomes/integrity))
    )
  ;
  perSystem =
    { inputs'
    , self'
    , lib
    , system
    , ...
    }: {
  	  packages.friendzones_dna = inputs.tnesh-stack.outputs.builders.${system}.dna {
        dnaManifest = ./workdir/dna.yaml;
        zomes = {
          notifications_integrity = inputs'.notifications-zome.packages.notifications_integrity;
          notifications = inputs'.notifications-zome.packages.notifications;
          friends_integrity = inputs'.friends-zome.packages.friends_integrity;
          friends = inputs'.friends-zome.packages.friends;
    # Include here the zome packages for this DNA, e.g.:
          # profiles_integrity = inputs'.profiles-zome.packages.profiles_integrity;
          # This overrides all the "bundled" properties for the DNA manifest
          friendzones_integrity = self'.packages.friendzones_integrity;
          friendzones = self'.packages.friendzones;
        };
      };
  	};
}
