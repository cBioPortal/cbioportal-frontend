cat yarn.lock webpack.config.js vendor-bundles.webpack.config.js > has_vender_build_changed

if hash md5 2>/dev/null; then
    vendorKey=$(md5 -q has_vender_build_changed)
else
    vendorKey=$(md5sum has_vender_build_changed | cut -d ' ' -f 1)
fi

CACHE_ROOT=$CACHE_ROOT_FOLDER

CACHE_DIR="$CACHE_ROOT/packages-root"

mkdir -p "$CACHE_DIR"

if [ -z "$CACHE_ROOT_FOLDER" ]; then
  echo "no cache folder defined, building modules"
  yarn run buildModules;
else
  echo "checking existence of cache for key: $CACHE_DIR/vendor_$vendorKey"

  if [ -d "$CACHE_DIR/vendor_$vendorKey" ]; then
      echo "using cache for $CACHE_DIR/vendor_$vendorKey"
      rm -r "./packages"
      cp -r "$CACHE_DIR/vendor_$vendorKey/packages" "./packages"
  else
      echo "no cache detected for $CACHE_DIR/vendor_$vendorKey"
      mkdir "${CACHE_DIR}/vendor_$vendorKey"
      yarn run buildModules;
      cp -r ./packages "$CACHE_DIR/vendor_$vendorKey"

       if [ -d "$CACHE_DIR/vendor_$vendorKey" ]; then
          echo "cache primed for $CACHE_DIR/vendor_$vendorKey"
       else
          echo "cachr prime FAILED for $CACHE_DIR/vendor_$vendorKey"
       fi
  fi
fi



