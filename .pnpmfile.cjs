function readPackage(pkg, context) {
  // Allow build scripts for packages that need them
  if (pkg.name === '@swc/core' || pkg.name === 'esbuild') {
    pkg.allowBuild = true;
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
